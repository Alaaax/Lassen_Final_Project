# import httpx
# import asyncio
# import os
# from dotenv import load_dotenv

# load_dotenv()

# KEY  = os.getenv("SIWAR_API_KEY")
# BASE = "https://siwar.ksaa.gov.sa"
# WORD = "امل"

# async def test():
#     print(f"المفتاح: {KEY[:20] if KEY else 'مفقود!'}\n")

#     headers = {
#         "apikey": KEY,
#         "Accept": "application/json",
#     }

#     async with httpx.AsyncClient(timeout=10) as client:

#         # ── اختبار 1: البحث العام ─────────────────────────────
#         print("--- /api/v1/external/public/search ---")
#         r = await client.get(
#             f"{BASE}/api/v1/external/public/search",
#             headers=headers,
#             params={"query": WORD, "limit": 3},
#         )
#         print(f"Status: {r.status_code}")
#         print(f"الرد: {r.text[:800]}\n")

#         # ── اختبار 2: البحث الخاص ─────────────────────────────
#         print("--- /api/v1/external/private/search ---")
#         r2 = await client.get(
#             f"{BASE}/api/v1/external/private/search",
#             headers=headers,
#             params={"query": WORD, "limit": 3},
#         )
#         print(f"Status: {r2.status_code}")
#         print(f"الرد: {r2.text[:800]}\n")

#         # ── اختبار 3: المعاني العامة ──────────────────────────
#         print("--- /api/v1/external/public/senses ---")
#         r3 = await client.get(
#             f"{BASE}/api/v1/external/public/senses",
#             headers=headers,
#             params={"query": WORD, "limit": 3},
#         )
#         print(f"Status: {r3.status_code}")
#         print(f"الرد: {r3.text[:800]}\n")

#         # ── اختبار 4: المعاني الخاصة ─────────────────────────
#         print("--- /api/v1/external/private/senses ---")
#         r4 = await client.get(
#             f"{BASE}/api/v1/external/private/senses",
#             headers=headers,
#             params={"query": WORD, "limit": 3},
#         )
#         print(f"Status: {r4.status_code}")
#         print(f"الرد: {r4.text[:800]}\n")

#         # ── اختبار 5: قائمة المعاجم المتاحة ──────────────────
#         print("--- /api/v1/external/public/lexicons ---")
#         r5 = await client.get(
#             f"{BASE}/api/v1/external/public/lexicons",
#             headers=headers,
#         )
#         print(f"Status: {r5.status_code}")
#         print(f"الرد: {r5.text[:800]}\n")

# asyncio.run(test())