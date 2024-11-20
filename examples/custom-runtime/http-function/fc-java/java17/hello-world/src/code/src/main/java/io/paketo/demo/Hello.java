package io.paketo.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Hello {

  @GetMapping("/")
  public String Greeting() {
    return "Hello word!";
  }
}

