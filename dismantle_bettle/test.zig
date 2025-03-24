const std = @import("std");
const imports = @import("imports");

test "test" {
    std.debug.print("{s}\n", .{imports.simpleNode});    
}
