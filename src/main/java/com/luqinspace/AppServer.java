package com.luqinspace;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

public class AppServer {
    private static final int PORT = integerEnv("APP_PORT", 8080);
    private static final File WEB_ROOT = new File("web");
    private static final File UPLOAD_ROOT = new File("uploads");

    private static final String DB_URL = valueEnv("DB_URL",
            "jdbc:mysql://localhost:3306/luqin_space?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false");
    private static final String DB_USER = valueEnv("DB_USER", "root");
    private static final String DB_PASSWORD = valueEnv("DB_PASSWORD", "123456");

    public static void main(String[] args) throws Exception {
        ensureUploadRoot();
        loadMysqlDriver();
        initDatabase();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/items", new ItemHandler());
        server.createContext("/uploads", new UploadHandler());
        server.createContext("/", new StaticHandler());
        server.setExecutor(null);
        server.start();

        System.out.println("陆勤家的空间已启动: http://localhost:" + PORT);
        System.out.println("MySQL: " + DB_URL);
    }

    private static void initDatabase() throws SQLException {
        String sql = "CREATE TABLE IF NOT EXISTS space_items ("
                + "id BIGINT PRIMARY KEY AUTO_INCREMENT,"
                + "category VARCHAR(32) NOT NULL,"
                + "title VARCHAR(120) NOT NULL,"
                + "description TEXT,"
                + "image_path VARCHAR(255),"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        try (Connection connection = getConnection(); Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }

    private static void loadMysqlDriver() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException first) {
            try {
                Class.forName("com.mysql.jdbc.Driver");
            } catch (ClassNotFoundException ignored) {
                System.out.println("提示: 未找到 MySQL JDBC 驱动，请把 mysql-connector-j 的 jar 放到 lib 目录。");
            }
        }
    }

    private static void ensureUploadRoot() {
        if (!UPLOAD_ROOT.exists() && !UPLOAD_ROOT.mkdirs()) {
            throw new IllegalStateException("无法创建上传目录: " + UPLOAD_ROOT.getAbsolutePath());
        }
    }

    private static String valueEnv(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private static int integerEnv(String name, int fallback) {
        try {
            return Integer.parseInt(valueEnv(name, String.valueOf(fallback)));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private static class ItemHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                String method = exchange.getRequestMethod().toUpperCase(Locale.ROOT);
                if ("GET".equals(method)) {
                    handleList(exchange);
                } else if ("POST".equals(method)) {
                    handleCreate(exchange);
                } else if ("PUT".equals(method)) {
                    handleUpdate(exchange);
                } else if ("DELETE".equals(method)) {
                    handleDelete(exchange);
                } else {
                    send(exchange, 405, jsonMessage("不支持的请求方法"));
                }
            } catch (Exception ex) {
                ex.printStackTrace();
                send(exchange, 500, jsonMessage("服务器处理失败: " + ex.getMessage()));
            }
        }

        private void handleList(HttpExchange exchange) throws SQLException, IOException {
            String category = queryParams(exchange).get("category");
            String sql = "SELECT id, category, title, description, image_path, created_at, updated_at "
                    + "FROM space_items WHERE (? IS NULL OR category = ?) ORDER BY updated_at DESC, id DESC";
            List<String> rows = new ArrayList<>();
            try (Connection connection = getConnection();
                 PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setString(1, emptyToNull(category));
                statement.setString(2, emptyToNull(category));
                try (ResultSet resultSet = statement.executeQuery()) {
                    while (resultSet.next()) {
                        rows.add(itemToJson(resultSet));
                    }
                }
            }
            send(exchange, 200, "[" + join(rows) + "]");
        }

        private void handleCreate(HttpExchange exchange) throws Exception {
            MultipartData multipart = MultipartData.parse(exchange);
            String imagePath = saveImage(multipart.fileName, multipart.fileBytes);
            String sql = "INSERT INTO space_items(category, title, description, image_path) VALUES(?, ?, ?, ?)";
            try (Connection connection = getConnection();
                 PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setString(1, fallback(multipart.fields.get("category"), "homework"));
                statement.setString(2, fallback(multipart.fields.get("title"), "未命名内容"));
                statement.setString(3, fallback(multipart.fields.get("description"), ""));
                statement.setString(4, imagePath);
                statement.executeUpdate();
            }
            send(exchange, 201, jsonMessage("添加成功"));
        }

        private void handleUpdate(HttpExchange exchange) throws Exception {
            Map<String, String> query = queryParams(exchange);
            long id = Long.parseLong(fallback(query.get("id"), "0"));
            MultipartData multipart = MultipartData.parse(exchange);
            String imagePath = saveImage(multipart.fileName, multipart.fileBytes);

            String sql = imagePath == null
                    ? "UPDATE space_items SET category=?, title=?, description=? WHERE id=?"
                    : "UPDATE space_items SET category=?, title=?, description=?, image_path=? WHERE id=?";
            try (Connection connection = getConnection();
                 PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setString(1, fallback(multipart.fields.get("category"), "homework"));
                statement.setString(2, fallback(multipart.fields.get("title"), "未命名内容"));
                statement.setString(3, fallback(multipart.fields.get("description"), ""));
                if (imagePath == null) {
                    statement.setLong(4, id);
                } else {
                    statement.setString(4, imagePath);
                    statement.setLong(5, id);
                }
                statement.executeUpdate();
            }
            send(exchange, 200, jsonMessage("更新成功"));
        }

        private void handleDelete(HttpExchange exchange) throws SQLException, IOException {
            Map<String, String> query = queryParams(exchange);
            long id = Long.parseLong(fallback(query.get("id"), "0"));
            try (Connection connection = getConnection();
                 PreparedStatement statement = connection.prepareStatement("DELETE FROM space_items WHERE id=?")) {
                statement.setLong(1, id);
                statement.executeUpdate();
            }
            send(exchange, 200, jsonMessage("删除成功"));
        }
    }

    private static class StaticHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path == null || "/".equals(path)) {
                path = "/index.html";
            }
            File target = new File(WEB_ROOT, URLDecoder.decode(path.substring(1), "UTF-8")).getCanonicalFile();
            if (!target.getPath().startsWith(WEB_ROOT.getCanonicalPath()) || !target.isFile()) {
                sendText(exchange, 404, "Not found");
                return;
            }
            Headers headers = exchange.getResponseHeaders();
            headers.set("Content-Type", contentType(target.getName()));
            byte[] bytes = Files.readAllBytes(target.toPath());
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream output = exchange.getResponseBody()) {
                output.write(bytes);
            }
        }
    }

    private static class UploadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath().replaceFirst("^/uploads/?", "");
            File target = new File(UPLOAD_ROOT, URLDecoder.decode(path, "UTF-8")).getCanonicalFile();
            if (!target.getPath().startsWith(UPLOAD_ROOT.getCanonicalPath()) || !target.isFile()) {
                sendText(exchange, 404, "Not found");
                return;
            }
            exchange.getResponseHeaders().set("Content-Type", contentType(target.getName()));
            byte[] bytes = Files.readAllBytes(target.toPath());
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream output = exchange.getResponseBody()) {
                output.write(bytes);
            }
        }
    }

    private static class MultipartData {
        private final Map<String, String> fields = new HashMap<>();
        private String fileName;
        private byte[] fileBytes;

        static MultipartData parse(HttpExchange exchange) throws IOException {
            String contentType = exchange.getRequestHeaders().getFirst("Content-Type");
            if (contentType == null || !contentType.contains("multipart/form-data")) {
                throw new IOException("请使用 multipart/form-data 提交表单");
            }
            String boundary = "--" + contentType.substring(contentType.indexOf("boundary=") + 9).trim();
            byte[] body = readAll(exchange.getRequestBody());
            String raw = new String(body, StandardCharsets.ISO_8859_1);
            MultipartData data = new MultipartData();
            String[] parts = raw.split(Pattern.quote(boundary));
            for (String part : parts) {
                int split = part.indexOf("\r\n\r\n");
                if (split < 0 || !part.contains("Content-Disposition")) {
                    continue;
                }
                String headers = part.substring(0, split);
                String content = part.substring(split + 4);
                if (content.endsWith("\r\n")) {
                    content = content.substring(0, content.length() - 2);
                }
                String name = headerValue(headers, "name");
                String filename = headerValue(headers, "filename");
                if (filename == null || filename.trim().isEmpty()) {
                    data.fields.put(name, new String(content.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8));
                } else {
                    data.fileName = filename;
                    data.fileBytes = content.getBytes(StandardCharsets.ISO_8859_1);
                }
            }
            return data;
        }

        private static String headerValue(String headers, String key) {
            String token = key + "=\"";
            int start = headers.indexOf(token);
            if (start < 0) {
                return null;
            }
            start += token.length();
            int end = headers.indexOf('"', start);
            return end < 0 ? null : headers.substring(start, end);
        }
    }

    private static String saveImage(String originalName, byte[] bytes) throws IOException {
        if (originalName == null || bytes == null || bytes.length == 0) {
            return null;
        }
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0) {
            ext = originalName.substring(dot).replaceAll("[^A-Za-z0-9.]", "");
        }
        String fileName = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date())
                + "-" + UUID.randomUUID().toString().replace("-", "") + ext;
        File target = new File(UPLOAD_ROOT, fileName);
        try (FileOutputStream output = new FileOutputStream(target)) {
            output.write(bytes);
        }
        return "/uploads/" + fileName;
    }

    private static String itemToJson(ResultSet rs) throws SQLException {
        return "{"
                + "\"id\":" + rs.getLong("id") + ","
                + "\"category\":\"" + escape(rs.getString("category")) + "\","
                + "\"title\":\"" + escape(rs.getString("title")) + "\","
                + "\"description\":\"" + escape(rs.getString("description")) + "\","
                + "\"imagePath\":\"" + escape(rs.getString("image_path")) + "\","
                + "\"createdAt\":\"" + escape(rs.getString("created_at")) + "\","
                + "\"updatedAt\":\"" + escape(rs.getString("updated_at")) + "\""
                + "}";
    }

    private static Map<String, String> queryParams(HttpExchange exchange) throws IOException {
        Map<String, String> params = new HashMap<>();
        String query = exchange.getRequestURI().getRawQuery();
        if (query == null || query.trim().isEmpty()) {
            return params;
        }
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);
            String key = URLDecoder.decode(parts[0], "UTF-8");
            String value = parts.length > 1 ? URLDecoder.decode(parts[1], "UTF-8") : "";
            params.put(key, value);
        }
        return params;
    }

    private static byte[] readAll(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        while ((read = input.read(buffer)) != -1) {
            output.write(buffer, 0, read);
        }
        return output.toByteArray();
    }

    private static void send(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static void sendText(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static String contentType(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    private static String jsonMessage(String message) {
        return "{\"message\":\"" + escape(message) + "\"}";
    }

    private static String join(List<String> values) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append(values.get(i));
        }
        return builder.toString();
    }

    private static String fallback(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private static String emptyToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }
}
