Feature: Students
  As a user
  I want to be able to create students
  So that I can track their data afterwards

  #@active
  Scenario: Create a student
    Given The API is running
    When I create a new student with the following details:
    | name  | age | sex   | fearFactor    |
    | Greg  | 25  | Male  | 1             |
    Then the response status code should be 201
    And The parameter 'name' should be equal to 'Greg'

  Scenario: Get students
    Given The API is running
    When I request all students
    Then the response status code should be 200
    Then I receive object of students
  #@active
  Scenario: Get a specific student by id
    Given The API is running
    When I request a specific student by its ID 's2'
    Then the response status code should be 200
    Then The parameter 'id' should be equal to 's2'

  
  
  
  
  
  
  #Scenario: Create appointment with collector

  #Scenario: Request all possible appointments

