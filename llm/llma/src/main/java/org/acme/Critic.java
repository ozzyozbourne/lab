package org.acme;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import io.quarkiverse.langchain4j.RegisterAiService;
import io.smallrye.mutiny.Multi;


@RegisterAiService
@SystemMessage("Critic the joke")
public interface Critic {
    Multi<String> chat(@UserMessage String message);
}
