const std = @import("std");

pub fn main() void {
    checker(tester);
}

fn checker(comptime f: anytype) void {
    std.debug.print("{}\n", .{ std.meta.ArgsTuple(@TypeOf(f))});
}


fn tester(a: i32, b: usize, c: u8) i32 {
    _, _= .{b, c};
    return a;
}

