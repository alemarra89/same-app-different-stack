import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.QRCodeReader;
import com.google.zxing.PlanarYUVLuminanceSource;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.common.HybridBinarizer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/** Run with ZXing core on the classpath. Payloads are exact IDs, never URLs. */
class GenerateDemoQrs {
    public static void main(String[] args) throws Exception {
        Path target = Path.of(args.length > 0 ? args[0] : "demo-qr");
        Files.createDirectories(target);
        for (String id : new String[]{"EVT-001", "EVT-002", "EVT-003", "EVT-004", "EVT-005", "EVT-006", "ERR-999"}) {
            BitMatrix matrix = new QRCodeWriter().encode(id, BarcodeFormat.QR_CODE, 29, 29,
                Map.of(EncodeHintType.MARGIN, 4));
            int scale = 10;
            int frameWidth = matrix.getWidth() * scale;
            int frameHeight = matrix.getHeight() * scale;
            byte[] pixels = new byte[frameWidth * frameHeight];
            for (int y = 0; y < frameHeight; y++) for (int x = 0; x < frameWidth; x++) {
                pixels[y * frameWidth + x] = (byte)(matrix.get(x / scale, y / scale) ? 0 : 255);
            }
            var source = new PlanarYUVLuminanceSource(pixels, frameWidth, frameHeight,
                0, 0, frameWidth, frameHeight, false);
            String decoded = new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(source))).getText();
            if (!id.equals(decoded)) throw new AssertionError("Incorrect QR payload: " + decoded);
            StringBuilder svg = new StringBuilder("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + matrix.getWidth() + " " + matrix.getHeight() + "\" width=\"290\" height=\"290\" shape-rendering=\"crispEdges\"><title>" + id + "</title><rect width=\"100%\" height=\"100%\" fill=\"white\"/><path fill=\"black\" d=\"");
            for (int y = 0; y < matrix.getHeight(); y++) for (int x = 0; x < matrix.getWidth(); x++) {
                if (matrix.get(x, y)) svg.append("M").append(x).append(" ").append(y).append("h1v1h-1z");
            }
            svg.append("\"/></svg>\n");
            Files.writeString(target.resolve(id + ".svg"), svg);
            System.out.println(id + ": " + target.resolve(id + ".svg"));
        }
    }
}
