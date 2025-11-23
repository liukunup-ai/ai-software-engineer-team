from typing import List
from pydantic import BaseModel


class CommandRequest(BaseModel):
    """命令执行请求"""
    command: str
    args: List[str] = []


class CommandResponse(BaseModel):
    """命令执行结果"""
    command: str
    args: List[str]

    exit_code: int
    stdout: str
    stderr: str
    error_message: str = None
