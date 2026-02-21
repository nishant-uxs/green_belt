#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Symbol};

#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Error {
    InsufficientBalance = 1,
    Unauthorized = 2,
    InvalidAmount = 3,
}

pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    /// Initialize the token with name, symbol, and initial supply
    pub fn initialize(
        env: Env,
        admin: Address,
        name: Symbol,
        symbol: Symbol,
        initial_supply: i128,
    ) -> Result<(), Error> {
        if initial_supply <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Store admin
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);

        // Store metadata
        env.storage().instance().set(&Symbol::new(&env, "name"), &name);
        env.storage().instance().set(&Symbol::new(&env, "symbol"), &symbol);

        // Mint initial supply to admin
        let balance_key = Symbol::new(&env, "balance");
        let mut balances = env.storage().instance().get::<_, i128>(&balance_key).unwrap_or(0);
        balances += initial_supply;
        env.storage().instance().set(&balance_key, &balances);

        // Store individual balance for admin
        let admin_balance_key = Symbol::new(&env, &admin.clone());
        env.storage().instance().set(&admin_balance_key, &initial_supply);

        // Store total supply
        env.storage().instance().set(&Symbol::new(&env, "total_supply"), &initial_supply);

        Ok(())
    }

    /// Get token name
    pub fn name(env: Env) -> Symbol {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "name"))
            .unwrap()
    }

    /// Get token symbol
    pub fn symbol(env: Env) -> Symbol {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "symbol"))
            .unwrap()
    }

    /// Get total supply
    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "total_supply"))
            .unwrap()
    }

    /// Get balance of an account
    pub fn balance_of(env: Env, account: Address) -> i128 {
        let balance_key = Symbol::new(&env, &account);
        env.storage()
            .instance()
            .get(&balance_key)
            .unwrap_or(0)
    }

    /// Transfer tokens from caller to recipient
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Check from balance
        let from_balance = Self::balance_of(env.clone(), from.clone());
        if from_balance < amount {
            return Err(Error::InsufficientBalance);
        }

        // Subtract from sender
        let from_key = Symbol::new(&env, &from);
        let new_from_balance = from_balance - amount;
        env.storage().instance().set(&from_key, &new_from_balance);

        // Add to recipient
        let to_key = Symbol::new(&env, &to);
        let to_balance = Self::balance_of(env.clone(), to.clone());
        let new_to_balance = to_balance + amount;
        env.storage().instance().set(&to_key, &new_to_balance);

        // Emit transfer event
        let topics = (Symbol::new(&env, "transfer"), from, to);
        env.events().publish(topics, amount);

        Ok(())
    }

    /// Mint new tokens (admin only)
    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Check admin authorization
        let admin = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "admin"))
            .unwrap();
        if env.invoker() != admin {
            return Err(Error::Unauthorized);
        }

        // Update total supply
        let current_supply = Self::total_supply(env.clone());
        let new_supply = current_supply + amount;
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "total_supply"), &new_supply);

        // Add to recipient balance
        let to_key = Symbol::new(&env, &to);
        let to_balance = Self::balance_of(env.clone(), to.clone());
        let new_to_balance = to_balance + amount;
        env.storage().instance().set(&to_key, &new_to_balance);

        // Emit mint event
        let topics = (Symbol::new(&env, "mint"), to);
        env.events().publish(topics, amount);

        Ok(())
    }

    /// Burn tokens (admin only)
    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Check admin authorization
        let admin = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "admin"))
            .unwrap();
        if env.invoker() != admin {
            return Err(Error::Unauthorized);
        }

        // Check balance
        let from_balance = Self::balance_of(env.clone(), from.clone());
        if from_balance < amount {
            return Err(Error::InsufficientBalance);
        }

        // Update total supply
        let current_supply = Self::total_supply(env.clone());
        let new_supply = current_supply - amount;
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "total_supply"), &new_supply);

        // Subtract from balance
        let from_key = Symbol::new(&env, &from);
        let new_from_balance = from_balance - amount;
        env.storage().instance().set(&from_key, &new_from_balance);

        // Emit burn event
        let topics = (Symbol::new(&env, "burn"), from);
        env.events().publish(topics, amount);

        Ok(())
    }
}
