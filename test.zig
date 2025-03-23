const std = @import("std");

var s: usize = 0;
pub fn main() void {
    for(30..40) |_| { 
        const iter = 40 -  s;  
        s += 1;
        std.debug.print("{d}", .{iter});
    }
}
