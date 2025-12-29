package io.github.vudsen.spectre.httpclient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Main
 *
 * @author vudsen
 * @date 2025/07/08 11:02
 **/
public class Main {

    public static void main(String[] args) {
        var endpoint = args[0];
        var encodedBody = args[1];
        try {
            doRequest(encodedBody, endpoint);
        } catch (IOException e) {
            System.err.println(e.getMessage());
            System.exit(1);
        }
    }

    private static void doRequest(String encodedBody, String endpoint) throws IOException {
        var body = Base64.getDecoder().decode(encodedBody);

        var url = new URL(endpoint);
        var connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json");

        try (var out = connection.getOutputStream()) {
            out.write(body);
        }

        OutputStream out;

        if (connection.getResponseCode() == HttpURLConnection.HTTP_OK) {
            out = System.out;
        } else {
            out = System.err;
        }
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
            String inputLine;
            var content = new StringBuilder();
            while ((inputLine = reader.readLine()) != null) {
                content.append(inputLine);
            }
            out.write(content.toString().getBytes(StandardCharsets.UTF_8));
            connection.disconnect();
        }

        if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
            System.err.print(connection.getResponseCode());
            System.exit(1);
        }
    }
}
