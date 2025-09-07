package org.acme;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import io.quarkiverse.langchain4j.RegisterAiService;
import io.smallrye.mutiny.Multi;

@RegisterAiService
@SystemMessage("Try to generate the best joke as prompted by the user requirements")
public interface GenJoke {
    Multi<String> chat(@UserMessage String message);
}
