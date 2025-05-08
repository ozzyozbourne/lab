package in.action.chad.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FunRestController {

    private final Coach coach;

    @Autowired
    public FunRestController(Coach coach) {
        this.coach = coach;
    }

    @GetMapping("/")
    public String sayHello() {
        return "Hello Wd";
    }

    @GetMapping("/workout")
    public String getDailyWorkout() {
        return coach.getDailyWorkout();
    }

    @GetMapping("/fortune")
    public String getDailyFortune() {
        return "Today is your lucky day";
    }
}
