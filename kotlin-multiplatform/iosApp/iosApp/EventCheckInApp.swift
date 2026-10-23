import SwiftUI
import Shared

@main
struct EventCheckInApp: App {
    var body: some Scene {
        WindowGroup { ComposeRoot().ignoresSafeArea() }
    }
}

private struct ComposeRoot: UIViewControllerRepresentable {
    func makeCoordinator() -> IosScanner { IosScanner() }

    func makeUIViewController(context: Context) -> UIViewController {
        let controller = MainViewControllerKt.MainViewController(scanner: context.coordinator)
        context.coordinator.presenter = controller
        return controller
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}

    static func dismantleUIViewController(_ uiViewController: UIViewController, coordinator: IosScanner) {
        coordinator.stop()
    }
}
