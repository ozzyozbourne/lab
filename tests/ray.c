#include "raylib.h"
#include <math.h>

int main(void)
{
    // Initialization
    const int screenWidth = 800;
    const int screenHeight = 450;

    InitWindow(screenWidth, screenHeight, "Raylib Advanced Test");
    
    // Define the camera to look into our 3d world
    Camera3D camera = { 0 };
    camera.position = (Vector3){ 10.0f, 10.0f, 10.0f };  // Camera position
    camera.target = (Vector3){ 0.0f, 0.0f, 0.0f };       // Camera looking at point
    camera.up = (Vector3){ 0.0f, 1.0f, 0.0f };           // Camera up vector
    camera.fovy = 45.0f;                                 // Camera field-of-view Y
    camera.projection = CAMERA_PERSPECTIVE;              // Camera projection type
    
    // Define cube positions
    Vector3 cubePosition = { 0.0f, 0.0f, 0.0f };
    Vector3 cubeSize = { 2.0f, 2.0f, 2.0f };
    
    // Define sphere position and radius
    Vector3 spherePosition = { 3.0f, 0.0f, 0.0f };
    float sphereRadius = 1.0f;
    
    // Rotation variables
    float rotationAngle = 0.0f;
    
    SetTargetFPS(60);               // Set our game to run at 60 frames-per-second
    
    // Main game loop
    while (!WindowShouldClose())    // Detect window close button or ESC key
    {
        // Update
        rotationAngle += 1.0f;      // Rotate 1 degree per frame
        
        // Camera orbit around the scene
        camera.position.x = sinf(DEG2RAD * rotationAngle * 0.5f) * 15.0f;
        camera.position.z = cosf(DEG2RAD * rotationAngle * 0.5f) * 15.0f;
        
        // Draw
        BeginDrawing();
            ClearBackground(RAYWHITE);
            
            BeginMode3D(camera);
                // Draw the 3D cube
                DrawCube(cubePosition, cubeSize.x, cubeSize.y, cubeSize.z, RED);
                DrawCubeWires(cubePosition, cubeSize.x, cubeSize.y, cubeSize.z, MAROON);
                
                // Draw the 3D sphere
                DrawSphere(spherePosition, sphereRadius, BLUE);
                DrawSphereWires(spherePosition, sphereRadius, 16, 16, DARKBLUE);
                
                // Draw the 3D grid
                DrawGrid(10, 1.0f);
            EndMode3D();
            
            // Display info on screen
            DrawFPS(10, 10);
            DrawText("Welcome to Raylib 3D!", 10, 40, 20, DARKGRAY);
            DrawText("This confirms your installation can handle 3D graphics", 10, 70, 20, DARKGRAY);
            DrawText("Press ESC to close", 10, 100, 20, GRAY);
            
        EndDrawing();
    }

    // De-Initialization
    CloseWindow();        // Close window and OpenGL context

    return 0;
}
