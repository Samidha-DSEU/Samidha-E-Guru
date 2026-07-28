import sys
import logging
from app.db.session import engine, SessionLocal
from app.models import Base
from database.seeders.roles_seeder import seed_roles
from database.seeders.resource_types_seeder import seed_resource_types, seed_resource_sources
from database.seeders.classes_seeder import seed_classes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seeders")


def run_all_seeders():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    logger.info("Starting database seeders...")
    db = SessionLocal()
    try:
        roles_count = seed_roles(db)
        logger.info(f"Seeded {roles_count} new roles.")

        rt_count = seed_resource_types(db)
        logger.info(f"Seeded {rt_count} new resource types.")

        rs_count = seed_resource_sources(db)
        logger.info(f"Seeded {rs_count} new resource sources.")

        cls_count = seed_classes(db)
        logger.info(f"Seeded {cls_count} new classes.")

        logger.info("All seeders executed successfully!")
    except Exception as e:
        logger.error(f"Seeder execution failed: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_all_seeders()
