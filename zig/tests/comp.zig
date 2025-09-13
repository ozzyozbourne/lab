const std = @import("std");
const assert = std.debug.assert;

pub fn main() void {
    comptime {
        @compileLog("runtime value  = ", rn());
        @compileLog("comptime value = ", ct());
    }
}

fn rn() i32{
    return 10;
}

fn ct() comptime_int {
    return 10;
}
