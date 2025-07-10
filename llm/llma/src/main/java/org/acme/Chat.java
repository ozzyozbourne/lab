package org.acme;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import io.quarkiverse.langchain4j.RegisterAiService;
import io.smallrye.mutiny.Multi;
import jakarta.enterprise.context.SessionScoped;

@SessionScoped
@RegisterAiService
@SystemMessage("You will answer in a concise and succinct manner to each question post to you")
public interface Chat {
    Multi<String> chat(@UserMessage String message);
}
