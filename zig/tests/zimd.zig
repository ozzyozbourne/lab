const std = @import("std");

pub fn main() void {
    // Define a 4-element vector of f32 values
    const F32x4 = @Vector(4, f32);
    
    // Create vectors with initial values
    const v0 = F32x4{ 1.0, 2.0, 3.0, 4.0 };
    const v1 = F32x4{ 5.0, 6.0, 7.0, 8.0 };
    
    // Perform vector addition - this automatically uses NEON on M2
    const sum = v0 + v1;
    
    // Print the results
    std.debug.print("Vector sum: {any}\n", .{sum});
}
