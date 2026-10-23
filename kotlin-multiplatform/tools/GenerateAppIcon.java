import java.awt.*;
import java.awt.image.BufferedImage;
import java.nio.file.*;
import javax.imageio.ImageIO;

class GenerateAppIcon {
    public static void main(String[] args) throws Exception {
        BufferedImage icon = new BufferedImage(1024, 1024, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = icon.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.setColor(new Color(0x25785B));
        graphics.fillRect(0, 0, 1024, 1024);
        graphics.setColor(Color.WHITE);
        graphics.setStroke(new BasicStroke(76, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        graphics.drawPolyline(new int[]{265, 436, 759}, new int[]{512, 683, 341}, 3);
        graphics.dispose();
        Path target = Path.of("iosApp/iosApp/Assets.xcassets/AppIcon.appiconset/AppIcon.png");
        Files.createDirectories(target.getParent());
        ImageIO.write(icon, "png", target.toFile());
        System.out.println(target);
    }
}
