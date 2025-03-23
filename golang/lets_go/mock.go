package main

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"testing"
)

// Step 1: Define a domain model
type User struct {
	ID    int
	Name  string
	Email string
}

// Step 2: Define the repository interface
// This defines the contract that both real and mock implementations must follow
type UserRepository interface {
	FindByID(id int) (*User, error)
	FindAll() ([]*User, error)
	Create(user *User) error
	Update(user *User) error
	Delete(id int) error
}

// Step 3: Create the real implementation
type SQLUserRepository struct {
	db *sql.DB
}

func NewSQLUserRepository(db *sql.DB) UserRepository {
	return &SQLUserRepository{db: db}
}

func (r *SQLUserRepository) FindByID(id int) (*User, error) {
	// Real implementation that queries the database
	row := r.db.QueryRow("SELECT id, name, email FROM users WHERE id = ?", id)

	var user User
	err := row.Scan(&user.ID, &user.Name, &user.Email)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *SQLUserRepository) FindAll() ([]*User, error) {
	// Implementation omitted for brevity
	return nil, nil
}

func (r *SQLUserRepository) Create(user *User) error {
	// Implementation omitted for brevity
	return nil
}

func (r *SQLUserRepository) Update(user *User) error {
	// Implementation omitted for brevity
	return nil
}

func (r *SQLUserRepository) Delete(id int) error {
	// Implementation omitted for brevity
	return nil
}

// Step 4: Create the mock implementation
type MockUserRepository struct {
	users map[int]*User
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users: make(map[int]*User),
	}
}

func (m *MockUserRepository) FindByID(id int) (*User, error) {
	// In-memory implementation for testing
	user, exists := m.users[id]
	if !exists {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (m *MockUserRepository) FindAll() ([]*User, error) {
	users := make([]*User, 0, len(m.users))
	for _, user := range m.users {
		users = append(users, user)
	}
	return users, nil
}

func (m *MockUserRepository) Create(user *User) error {
	// For testing, auto-generate ID if not provided
	if user.ID == 0 {
		user.ID = len(m.users) + 1
	}

	// Check if ID already exists
	if _, exists := m.users[user.ID]; exists {
		return errors.New("user with this ID already exists")
	}

	m.users[user.ID] = user
	return nil
}

func (m *MockUserRepository) Update(user *User) error {
	if _, exists := m.users[user.ID]; !exists {
		return errors.New("user not found")
	}

	m.users[user.ID] = user
	return nil
}

func (m *MockUserRepository) Delete(id int) error {
	if _, exists := m.users[id]; !exists {
		return errors.New("user not found")
	}

	delete(m.users, id)
	return nil
}

// Step 5: Create helper methods for testing
func (m *MockUserRepository) AddMockUsers(users ...*User) {
	for _, user := range users {
		m.users[user.ID] = user
	}
}

// Step 6: Create a service that uses the repository
type UserService struct {
	repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUserByID(id int) (*User, error) {
	return s.repo.FindByID(id)
}

// Step 7: Write tests using the mock
func TestUserService_GetUserByID(t *testing.T) {
	// Setup
	mockRepo := NewMockUserRepository()
	mockRepo.AddMockUsers(
		&User{ID: 1, Name: "Alice", Email: "alice@example.com"},
		&User{ID: 2, Name: "Bob", Email: "bob@example.com"},
	)

	service := NewUserService(mockRepo)

	// Test cases
	tests := []struct {
		name     string
		id       int
		wantName string
		wantErr  bool
	}{
		{"Existing user", 1, "Alice", false},
		{"Another existing user", 2, "Bob", false},
		{"Non-existent user", 3, "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := service.GetUserByID(tt.id)

			// Check error
			if (err != nil) != tt.wantErr {
				t.Errorf("GetUserByID() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			// If expecting success, check user details
			if !tt.wantErr {
				if user.Name != tt.wantName {
					t.Errorf("GetUserByID() got name = %v, want %v", user.Name, tt.wantName)
				}
			}
		})
	}
}

// Step 8: Example of real application setup
// func main() {
// 	// Connect to real database
// 	db, err := sql.Open("mysql", "user:password@/dbname")
// 	if err != nil {
// 		log.Fatal(err)
// 	}
// 	defer db.Close()
//
// 	// Create real repository
// 	repo := NewSQLUserRepository(db)
//
// 	// Create service with real repository
// 	service := NewUserService(repo)
//
// 	// Use service
// 	user, err := service.GetUserByID(1)
// 	if err != nil {
// 		log.Fatal(err)
// 	}
//
// 	fmt.Printf("Found user: %s (%s)\n", user.Name, user.Email)
// }
