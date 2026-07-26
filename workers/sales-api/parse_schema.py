import re

with open("prod_dump.sql", "r") as f:
    sql = f.read()

statements = sql.split(";")
for stmt in statements:
    stmt = stmt.strip()
    if stmt.startswith("CREATE TABLE") or stmt.startswith("CREATE INDEX") or stmt.startswith("CREATE UNIQUE INDEX"):
        print(stmt + ";")
