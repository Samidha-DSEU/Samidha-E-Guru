# RBAC.md — Role-Based Access Control Specification

## Role Hierarchy & Permissions Matrix

| Feature / Action | Student | Volunteer | Alumni | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Browse / Search Resources** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Bookmark Resources & Progress** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Post in Community & Comment** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Register for Events** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Upload Resources (Pending)** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Create Events & Announcements** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Post Mentorship & Career Guidance**| ❌ | ❌ | ✅ | ✅ | ✅ |
| **Approve / Reject Resources** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Moderate Community & Reports** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Users & Role Assignment** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **View Audit & Activity Logs** | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## FastAPI Backend Authorization Dependency
```python
# Example RBAC Guard Usage
@router.post("/resources/{id}/approve")
async def approve_resource(
    id: UUID,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    ...
```
