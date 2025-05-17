const std = @import("std");

const Cat = struct {
    name: []const u8,
    age: i32,
};

fn createCat() Cat {
    const  cat = Cat{
        .name = "alskdjasd",
        .age = 23,
    };
    std.debug.print("{}\n", .{cat});
    return cat; // Entire Cat struct is copied here
}

pub fn main() void {
    std.debug.print("Hello!\n", .{});
    const cat = createCat(); // Receives a copy of the Cat struct
    std.debug.print("{}\n", .{cat});
}
