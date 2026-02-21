#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, Symbol,
};

fn create_env() -> Env {
    Env::default()
}

fn register_token_contract(env: &Env) -> Address {
    env.register_contract(None, TokenContract)
}

fn make_symbol(env: &Env, s: &str) -> Symbol {
    Symbol::new(env, s)
}

// ─── initialize ────────────────────────────────────────────────────────────────

#[test]
fn test_initialize() {
    let env = create_env();
    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let name = make_symbol(&env, "Stellar Token");
    let symbol = make_symbol(&env, "STR");
    let initial_supply = 1_000_000_000i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    assert_eq!(client.name(), name);
    assert_eq!(client.symbol(), symbol);
    assert_eq!(client.total_supply(), initial_supply);
    assert_eq!(client.balance_of(&admin), initial_supply);
}

#[test]
#[should_panic(expected = "InvalidAmount")]
fn test_initialize_zero_supply_panics() {
    let env = create_env();
    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let name = make_symbol(&env, "Bad Token");
    let symbol = make_symbol(&env, "BAD");

    client.initialize(&admin, &name, &symbol, &0i128);
}

// ─── balance_of ───────────────────────────────────────────────────────────────

#[test]
fn test_balance_of() {
    let env = create_env();
    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = make_symbol(&env, "Test Token");
    let symbol = make_symbol(&env, "TEST");
    let initial_supply = 1_000_000i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    assert_eq!(client.balance_of(&admin), initial_supply);
    assert_eq!(client.balance_of(&user), 0i128);
}

// ─── transfer ────────────────────────────────────────────────────────────────

#[test]
fn test_transfer() {
    let env = create_env();
    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = make_symbol(&env, "Transfer Token");
    let symbol = make_symbol(&env, "TRF");
    let initial_supply = 1_000_000i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    let transfer_amount = 100_000i128;
    client.transfer(&admin, &user, &transfer_amount);

    assert_eq!(client.balance_of(&admin), initial_supply - transfer_amount);
    assert_eq!(client.balance_of(&user), transfer_amount);
    assert_eq!(client.total_supply(), initial_supply); // Supply unchanged
}

#[test]
#[should_panic(expected = "InsufficientBalance")]
fn test_transfer_insufficient_balance_panics() {
    let env = create_env();
    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = make_symbol(&env, "Poor Token");
    let symbol = make_symbol(&env, "POOR");
    let initial_supply = 100i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    // Try to transfer more than available
    client.transfer(&admin, &user, &200i128);
}

#[test]
#[should_panic(expected = "InvalidAmount")]
fn test_transfer_zero_amount_panics() {
    let env = create_env();
    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = make_symbol(&env, "Zero Token");
    let symbol = make_symbol(&env, "ZERO");
    let initial_supply = 1_000_000i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    client.transfer(&admin, &user, &0i128);
}

// ─── mint ────────────────────────────────────────────────────────────────────

#[test]
fn test_mint() {
    let env = create_env();
    env.mock_all_auths();

    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = make_symbol(&env, "Mintable Token");
    let symbol = make_symbol(&env, "MINT");
    let initial_supply = 1_000_000i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    let mint_amount = 500_000i128;
    client.mint(&user, &mint_amount);

    assert_eq!(client.balance_of(&user), mint_amount);
    assert_eq!(client.total_supply(), initial_supply + mint_amount);
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_mint_unauthorized_panics() {
    let env = create_env();
    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let name = make_symbol(&env, "Secure Token");
    let symbol = make_symbol(&env, "SEC");
    let initial_supply = 1_000_000i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    // Try to mint as unauthorized user
    client.mint(&user, &100_000i128);
}

// ─── burn ────────────────────────────────────────────────────────────────────

#[test]
fn test_burn() {
    let env = create_env();
    env.mock_all_auths();

    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let name = make_symbol(&env, "Burnable Token");
    let symbol = make_symbol(&env, "BURN");
    let initial_supply = 1_000_000i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    let burn_amount = 200_000i128;
    client.burn(&admin, &burn_amount);

    assert_eq!(client.balance_of(&admin), initial_supply - burn_amount);
    assert_eq!(client.total_supply(), initial_supply - burn_amount);
}

#[test]
#[should_panic(expected = "InsufficientBalance")]
fn test_burn_insufficient_balance_panics() {
    let env = create_env();
    env.mock_all_auths();

    let contract_id = register_token_contract(&env);
    let client = TokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let name = make_symbol(&env, "No Burn Token");
    let symbol = make_symbol(&env, "NOBURN");
    let initial_supply = 100i128;

    client.initialize(&admin, &name, &symbol, &initial_supply);

    // Try to burn more than available
    client.burn(&admin, &200i128);
}
