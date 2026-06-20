from domain.lead.enums import Priority


class QualificationService:
    @staticmethod
    def calculate_score(
        website_quality: int = 0,
        seo: int = 0,
        instagram_activity: int = 0,
        google_reviews: int = 0,
        cta_quality: int = 0,
        business_activity: int = 0,
        growth_potential: int = 0,
    ) -> int:
        """
        Calculates the total qualification score based on weighted inputs.
        Inputs should be raw scores out of the max weight or normalized, here we assume
        they are passed as the points earned for that category.
        """
        total = (
            website_quality +
            seo +
            instagram_activity +
            google_reviews +
            cta_quality +
            business_activity +
            growth_potential
        )
        return min(max(total, 0), 100)

    @staticmethod
    def get_priority(score: int) -> Priority:
        if score >= 80:
            return Priority.HIGH
        elif score >= 60:
            return Priority.MEDIUM
        return Priority.LOW
