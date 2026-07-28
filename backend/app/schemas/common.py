from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel

T = TypeVar("T")


class MetaSchema(BaseModel):
    page: Optional[int] = None
    limit: Optional[int] = None
    total_items: Optional[int] = None
    total_pages: Optional[int] = None


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str


class StandardResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    meta: Optional[MetaSchema] = None
    errors: Optional[List[ErrorDetail]] = None

    @classmethod
    def success_response(
        cls,
        data: Optional[T] = None,
        message: str = "Operation completed successfully.",
        meta: Optional[MetaSchema] = None,
    ) -> "StandardResponse[T]":
        return cls(success=True, message=message, data=data, meta=meta, errors=None)

    @classmethod
    def error_response(
        cls,
        message: str = "An error occurred.",
        errors: Optional[List[ErrorDetail]] = None,
    ) -> "StandardResponse[T]":
        return cls(success=False, message=message, data=None, meta=None, errors=errors)
