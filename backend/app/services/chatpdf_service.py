import os
import logging
from typing import Dict, Any, Optional, List
import httpx

logger = logging.getLogger(__name__)

CHATPDF_API_URL = "https://api.chatpdf.com/v1"


class ChatPdfService:
    """Production-grade service wrapper for ChatPDF REST API (https://api.chatpdf.com/v1)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("CHATPDF_API_KEY")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("sec_your_"))

    async def add_pdf_by_url(self, pdf_url: str) -> Optional[str]:
        """
        Uploads a public PDF URL to ChatPDF API and returns a sourceId.
        Endpoints: POST https://api.chatpdf.com/v1/sources/add-url
        """
        if not self.is_configured():
            logger.info("ChatPDF API key not configured. Skipping ChatPDF source registration.")
            return None

        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {"url": pdf_url}

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    f"{CHATPDF_API_URL}/sources/add-url",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    source_id = data.get("sourceId")
                    logger.info(f"ChatPDF PDF source created successfully: {source_id}")
                    return source_id
                elif response.status_code == 429:
                    logger.warning("ChatPDF upload limit reached (HTTP 429).")
                    return None
                else:
                    logger.error(f"ChatPDF add-url error [{response.status_code}]: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Failed to connect to ChatPDF API during add_pdf_by_url: {e}")
            return None

    async def query_document(
        self,
        source_id: str,
        question: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Sends a user question to a registered ChatPDF sourceId.
        Endpoint: POST https://api.chatpdf.com/v1/chats/message
        """
        if not self.is_configured():
            return {
                "answer": "ChatPDF API key is not configured.",
                "references": [],
                "provider": "ChatPDF",
                "rate_limited": False,
                "retry_after_seconds": 0,
                "status": "not_configured"
            }

        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }

        # Build message history array
        messages = []
        if history:
            for msg in history[-6:]: # Keep last 6 exchanges for context window
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        messages.append({
            "role": "user",
            "content": f"Please answer clearly based on the document content. Question: {question}"
        })

        payload = {
            "sourceId": source_id,
            "messages": messages,
            "referenceSources": True
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(
                    f"{CHATPDF_API_URL}/chats/message",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data.get("content", "No answer returned.")
                    references = data.get("references", [])
                    
                    return {
                        "answer": content,
                        "references": references,
                        "provider": "ChatPDF API",
                        "rate_limited": False,
                        "retry_after_seconds": 0,
                        "status": "success"
                    }
                elif response.status_code == 429:
                    logger.warning("ChatPDF rate limit or quota exceeded (HTTP 429).")
                    return {
                        "answer": "⚡ ChatPDF request quota limit reached. Please wait 60s before submitting your next question.",
                        "references": [],
                        "provider": "ChatPDF API",
                        "rate_limited": True,
                        "retry_after_seconds": 60,
                        "status": "rate_limited"
                    }
                else:
                    err_msg = response.json().get("message", response.text) if response.content else response.reason_phrase
                    logger.error(f"ChatPDF message error [{response.status_code}]: {err_msg}")
                    return {
                        "answer": f"ChatPDF Error [{response.status_code}]: {err_msg}",
                        "references": [],
                        "provider": "ChatPDF API",
                        "rate_limited": False,
                        "retry_after_seconds": 0,
                        "status": "error"
                    }
        except Exception as e:
            logger.error(f"Exception during ChatPDF query execution: {e}")
            return {
                "answer": f"Connection error contacting ChatPDF engine: {str(e)}",
                "references": [],
                "provider": "ChatPDF API",
                "rate_limited": False,
                "retry_after_seconds": 0,
                "status": "connection_error"
            }


chatpdf_service = ChatPdfService()
