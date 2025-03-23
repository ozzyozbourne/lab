const std = @import("std");
const expect = std.testing.expect;

const simpleNode = struct {
    next: ?*@This() = null,
    value: i32,

    pub fn init(value: i32) @This() {
        return .{.value = value};
    }
};

test "no runtime side effects" {
    var data: i32 = 0;
    const T = @TypeOf(foo(i32, &data));

    try comptime expect(T == i32);
    try expect(data == 0);
}

fn foo(comptime T: type, ptr: *T) T {
    ptr.* += 1;
    return ptr.*;
}



test "testing_with_simple_nodes" {
    std.debug.print("{s}\n", .{@typeName(simpleNode)});
}
