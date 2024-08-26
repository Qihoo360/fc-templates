package handler;

import org.springframework.messaging.Message;

public class index {
    public static String handler(Message<String> message) {
        // var stringBuilder = new StringBuilder();
        // inputMessage.getHeaders()
        //   .forEach((key, value) -> {
        //     stringBuilder.append(key).append(": ").append(value).append(" ");
        //   });
        // var payload = inputMessage.getPayload();
        // if (!payload.isBlank()) {
        //   stringBuilder.append("echo: ").append(payload);
        // }
        // return stringBuilder.toString();
        return "Hello, world!";
    }
}
