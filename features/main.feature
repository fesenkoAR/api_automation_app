Feature: Shopping Cart
  As a shopper
  I want to add items to my cart
  So that I can purchase them later

  Scenario: Add item to cart
    Given I am logged in
    When I search for "product"
    And I add the first result to my cart
    Then the item should be added to my cart