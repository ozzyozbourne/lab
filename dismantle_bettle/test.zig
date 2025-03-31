const std = @import("std");
const imports = @import("imports");
const neon = std.Target.arm.Feature.neon;

test "test" {
    std.debug.print("{d}\n", .{std.Random.float(10, i32)});
    std.debug.print("{s}\n", .{imports.simpleNode});    
}
