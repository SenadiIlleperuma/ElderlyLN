const db = require('../db');

const scoreCaregiver = (caregiver, filters)=>{
    let score = 0;

    if(filters.district && caregiver.district && caregiver.toLowerCase()===filters.district.toLowerCase()){
        score += 5;
    }
    if(filters.language && caregiver.languages_spoken && caregiver.languages_spoken.includes(filters.language)){
        score +=3;

    }
    if (filters.category && caregiver.care_category && caregiver.care_category.includes(filters.category)) {
        score += 3;
    }
    score += Math.min(caregiver.experience_years || 0, 5) * 0.5; 

    score += (caregiver.avg_rating || 0);
    if (score === 0) return 0;
    return score;

    };

const searchCaregivers= async (filters)=>{
    const sql = ` SELECT 
            caregiver_id, user_fk, full_name, age, gender, district, 
            qualifications, experience_years, languages_spoken, 
            care_category, expected_rate, avg_rating, verification_badges
        FROM caregiver
        WHERE profile_status = 'Verified' OR profile_status = 'Pending Verification'
        `;
    
    const result = await db.query(sql);
    const caregivers = result.rows;

    const scoredCaregivers = caregivers
    .map(cg => ({
        ...cg,
        match_score:scoreCaregiver(cg, filters)
    }))
    .filter(cg=> cg.match_score> 0);

    scoredCaregivers.sort ((a, b)=> b.match_score- a.match_score);

    return scoredCaregivers;
};

module.exports ={
    searchCaregivers
};



