import tiktoken
from core.database import get_database

class TokenManager:
    GLOBAL_DAILY_QUOTA = 1000000 # 1 Million tokens split among users

    def __init__(self, default_balance=100000):
        self.default_balance = default_balance
        self.encoder = tiktoken.get_encoding("cl100k_base") # Standard for GPT-3.5/4 and similar

    def count_tokens(self, text: str) -> int:
        if not text:
            return 0
        return len(self.encoder.encode(text))

    async def get_balance(self, user_id: str) -> int:
        db = get_database()
        if not db:
            return 0
        
        user_tokens = await db["token_balances"].find_one({"user_id": user_id})
        if not user_tokens:
            # Initialize with default balance
            await db["token_balances"].insert_one({
                "user_id": user_id,
                "balance": self.default_balance,
                "total_used": 0
            })
            return self.default_balance
            
        return user_tokens.get("balance", 0)

    async def deduct_tokens(self, user_id: str, amount: int):
        db = get_database()
        if not db:
            return
            
        await db["token_balances"].update_one(
            {"user_id": user_id},
            {
                "$inc": {"balance": -amount, "total_used": amount}
            },
            upsert=True
        )

    async def rebalance_user_quota(self):
        """
        Calculates equal share and updates everyone's balance.
        """
        db = get_database()
        if not db:
            return
            
        num_users = await db["token_balances"].count_documents({})
        if num_users == 0:
            return
            
        share = self.GLOBAL_DAILY_QUOTA // num_users
        print(f"[Mars AI] Redistributing Quota: {share} tokens per user ({num_users} total users)")
        
        await db["token_balances"].update_many(
            {},
            {
                "$set": {"balance": share, "total_used": 0}
            }
        )

# Global instances — initialized on use
token_manager = TokenManager()
