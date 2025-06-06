package org.acme;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import io.quarkiverse.langchain4j.RegisterAiService;
import io.smallrye.mutiny.Multi;

@RegisterAiService(modelName = "curiousModel")
@SystemMessage("You will answer in a concise and succinct manner to each question post to you")
public interface MyLlama {
    Multi<String> chat(@UserMessage String message);
}
