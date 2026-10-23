import UIKit
import AVFoundation
import Shared

/// The protocol comes from commonMain. AVFoundation owns decoding and never sends frames off-device.
final class IosScanner: NSObject, Shared.Scanner {
    weak var presenter: UIViewController?
    private var listener: ScanListener?
    private var scannerController: BarcodeViewController?
    private var generation = UUID()

    func start(listener: ScanListener) {
        precondition(Thread.isMainThread)
        guard self.listener == nil else { return }
        self.listener = listener
        generation = UUID()
        let request = generation
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: presentScanner()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    guard let self = self, self.generation == request, self.listener != nil else { return }
                    if granted { self.presentScanner() }
                    else { self.finish(error: "Permesso fotocamera negato. Abilitalo nelle Impostazioni.") }
                }
            }
        case .denied, .restricted:
            finish(error: "Permesso fotocamera negato. Abilitalo nelle Impostazioni.")
        @unknown default:
            finish(error: "Scanner non supportato.")
        }
    }

    private func presentScanner() {
        guard let presenter = presenter, presenter.viewIfLoaded?.window != nil,
              presenter.presentedViewController == nil else {
            finish(error: "Scanner non disponibile.")
            return
        }
        guard AVCaptureDevice.default(for: .video) != nil else {
            finish(error: "Nessuna fotocamera disponibile.")
            return
        }
        let controller = BarcodeViewController()
        controller.onCode = { [weak self] code in self?.finish(code: code) }
        controller.onError = { [weak self] error in self?.finish(error: error) }
        controller.onCancel = { [weak self] in self?.finish() }
        controller.modalPresentationStyle = .fullScreen
        scannerController = controller
        presenter.present(controller, animated: true)
    }

    private func finish(code: String? = nil, error: String? = nil) {
        let callback = listener
        listener = nil
        generation = UUID()
        let completionGeneration = generation
        let controller = scannerController
        scannerController = nil
        controller?.stopCapture()
        let notify = { [weak self] in
            guard self?.generation == completionGeneration else { return }
            if let code = code { callback?.onCode(code: code) }
            else if let error = error { callback?.onError(message: error) }
            else { callback?.onCancel() }
        }
        if let controller = controller { controller.dismiss(animated: true, completion: notify) }
        else { notify() }
    }

    func stop() {
        precondition(Thread.isMainThread)
        listener = nil
        generation = UUID()
        scannerController?.stopCapture()
        scannerController?.dismiss(animated: false)
        scannerController = nil
    }
}

private final class CameraPreview: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
}

private final class BarcodeViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCode: ((String) -> Void)?
    var onError: ((String) -> Void)?
    var onCancel: (() -> Void)?
    private let session = AVCaptureSession()
    private let sessionQueue = DispatchQueue(label: "it.eventcheckin.capture")
    private let metadataOutput = AVCaptureMetadataOutput()
    private let preview = CameraPreview()
    private var observers: [NSObjectProtocol] = []
    // Accessed exclusively on sessionQueue, including setup, shutdown and interruptions.
    private var stopped = false
    // Accessed exclusively on the main thread.
    private var delivered = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        preview.previewLayer.session = session
        preview.previewLayer.videoGravity = .resizeAspectFill
        preview.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(preview)

        let title = UILabel()
        title.text = "Inquadra il QR sul biglietto"
        title.textColor = .white
        title.backgroundColor = UIColor.black.withAlphaComponent(0.7)
        title.font = .preferredFont(forTextStyle: .headline)
        title.adjustsFontForContentSizeCategory = true
        title.numberOfLines = 0
        title.textAlignment = .center
        title.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(title)

        let cancel = UIButton(type: .system)
        cancel.setTitle("Annulla scansione", for: .normal)
        cancel.accessibilityLabel = "Annulla scansione"
        cancel.setTitleColor(.white, for: .normal)
        cancel.backgroundColor = UIColor(red: 37 / 255, green: 120 / 255, blue: 91 / 255, alpha: 1)
        cancel.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        cancel.titleLabel?.adjustsFontForContentSizeCategory = true
        cancel.layer.cornerRadius = 12
        cancel.addTarget(self, action: #selector(cancelScan), for: .touchUpInside)
        cancel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(cancel)
        NSLayoutConstraint.activate([
            preview.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            preview.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            preview.topAnchor.constraint(equalTo: view.topAnchor),
            preview.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            title.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
            title.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            title.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            title.heightAnchor.constraint(greaterThanOrEqualToConstant: 52),
            cancel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            cancel.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            cancel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
            cancel.heightAnchor.constraint(greaterThanOrEqualToConstant: 52)
        ])

        let center = NotificationCenter.default
        observers.append(center.addObserver(forName: .AVCaptureSessionRuntimeError, object: session, queue: .main) { [weak self] _ in
            self?.reportError("Errore della fotocamera. Riprova.")
        })
        observers.append(center.addObserver(forName: .AVCaptureSessionWasInterrupted, object: session, queue: .main) { [weak self] _ in
            self?.reportError("Fotocamera interrotta o già in uso.")
        })
        observers.append(center.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { [weak self] _ in
            self?.cancelScan()
        })
        configureCapture()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // The demo declares portrait on iPhone and iPad, so preview and device agree.
        if preview.previewLayer.connection?.isVideoOrientationSupported == true {
            preview.previewLayer.connection?.videoOrientation = .portrait
        }
    }

    private func configureCapture() {
        sessionQueue.async { [weak self] in
            guard let self = self, !self.stopped else { return }
            do {
                guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
                        ?? AVCaptureDevice.default(for: .video) else {
                    self.failFromSession("Nessuna fotocamera disponibile.")
                    return
                }
                let input = try AVCaptureDeviceInput(device: device)
                self.session.beginConfiguration()
                self.session.sessionPreset = .high
                guard self.session.canAddInput(input), self.session.canAddOutput(self.metadataOutput) else {
                    self.session.commitConfiguration()
                    self.failFromSession("Scanner non supportato su questo dispositivo.")
                    return
                }
                self.session.addInput(input)
                self.session.addOutput(self.metadataOutput)
                self.metadataOutput.setMetadataObjectsDelegate(self, queue: .main)
                guard self.metadataOutput.availableMetadataObjectTypes.contains(.qr) else {
                    self.session.commitConfiguration()
                    self.failFromSession("Lettura QR non supportata.")
                    return
                }
                self.metadataOutput.metadataObjectTypes = [.qr]
                self.session.commitConfiguration()
                DispatchQueue.main.async { [weak self] in self?.view.setNeedsLayout() }
                self.session.startRunning()
            } catch {
                self.failFromSession("Impossibile avviare la fotocamera.")
            }
        }
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !delivered, let code = metadataObjects.compactMap({ $0 as? AVMetadataMachineReadableCodeObject })
            .first(where: { $0.type == .qr })?.stringValue else { return }
        delivered = true
        stopCapture()
        onCode?(code)
    }

    private func failFromSession(_ message: String) {
        DispatchQueue.main.async { [weak self] in self?.reportError(message) }
    }

    private func reportError(_ message: String) {
        guard !delivered else { return }
        delivered = true
        stopCapture()
        onError?(message)
    }

    @objc private func cancelScan() {
        guard !delivered else { return }
        delivered = true
        stopCapture()
        onCancel?()
    }

    func stopCapture() {
        sessionQueue.async { [self] in
            guard !stopped else { return }
            stopped = true
            metadataOutput.setMetadataObjectsDelegate(nil, queue: nil)
            if session.isRunning { session.stopRunning() }
            session.beginConfiguration()
            session.inputs.forEach { session.removeInput($0) }
            session.outputs.forEach { session.removeOutput($0) }
            session.commitConfiguration()
        }
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        stopCapture()
    }

    deinit { observers.forEach { NotificationCenter.default.removeObserver($0) } }
}
