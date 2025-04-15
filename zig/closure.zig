const std = @import("std");

fn createCounter(initial: i32, step: i32) fn() i32 {
    const Context = struct {
        count: i32,
        increment: i32,

        pub fn incr(self: *@This()) i32 {
            self.count += self.increment;
            return self.count;
        }
    };

    const context = Context{ .count = initial, .increment = step };

    return struct {
        pub fn call() i32 {
            return context.incr();
        }
    }.call;
}

pub fn main() !void {
    const counter1 = createCounter(0, 1);
    const counter2 = createCounter(10, 5);

    std.debug.print("Counter1: {}, {}, {}\n", .{counter1(), counter1(), counter1()});
    std.debug.print("Counter2: {}, {}, {}\n", .{counter2(), counter2(), counter2()});
}
