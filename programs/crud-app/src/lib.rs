use anchor_lang::prelude::*;

declare_id!("2gkXeGRVFLy7zTd25Uw3jM4Wifp8tv44HMawB5soWygA");

#[program]
pub mod crud_app {
    use super::*;

    pub fn create(ctx: Context<Create>, title: String, message: String) -> Result<()> {
        require!(title.len() <= 32, JournalError::TitleTooLong);
        require!(message.len() <= 50, JournalError::MessageTooLong);

        let entry = &mut ctx.accounts.journal_entry;
        entry.owner = ctx.accounts.owner.key();
        entry.title = title;
        entry.message = message;
        Ok(())
    }

    pub fn update(ctx: Context<Update>, _title: String, message: String) -> Result<()> {
        require!(message.len() <= 50, JournalError::MessageTooLong);

        ctx.accounts.journal_entry.message = message;
        Ok(())
    }

    pub fn delete(_ctx: Context<Delete>, _title: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct Create<'info> {
    #[account(
        init,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + Journal::INIT_SPACE,
    )]
    pub journal_entry: Account<'info, Journal>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct Update<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        has_one = owner,
    )]
    pub journal_entry: Account<'info, Journal>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct Delete<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        has_one = owner,
        close = owner,
    )]
    pub journal_entry: Account<'info, Journal>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Journal {
    pub owner: Pubkey,
    #[max_len(32)]
    pub title: String,
    #[max_len(50)]
    pub message: String,
}

#[error_code]
pub enum JournalError {
    #[msg("Title must be 32 bytes or fewer")]
    TitleTooLong,
    #[msg("Message must be 50 bytes or fewer")]
    MessageTooLong,
}
