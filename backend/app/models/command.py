from pydantic import BaseModel
from typing import List


class CommandRequest(BaseModel):
    """命令执行请求"""
    command: str
    args: List[str] = []


class CommandResult(BaseModel):
    """命令执行结果"""
    command: str
    args: List[str]
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int
