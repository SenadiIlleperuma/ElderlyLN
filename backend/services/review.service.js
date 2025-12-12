//services/review.service.js

const db= require('../db');

const getFamilyId=async(userId)=>{
    const sql= `SELECT family_id FROM family WHERE user_fk=$1`;
    const result= await db.query(sql,[userId]);

    if(result.rows.length===0){
         throw new Error ('Family profile not found.');
    }
    return result.rows[0].family_id;
};

const addReview=async(userId,bookingID,ratingScore,comments)=>{
    const client=awaitdb.pool.connect();
    try{
        await client.query('BEGIN'); 

        const familyId= await getFamilyId(userId);

const bookingSql = `
            SELECT caregiver_fk, booking_status
            FROM booking
            WHERE booking_id = $1 AND is_rated = FALSE AND booking_status = 'Completed'
        `;

        const bookingResult= await client.query(bookingSql,[bookingID]);
        const booking= bookingResult.rows[0];
       
        if(!booking){
            throw new Error ('Booking not found or already rated.');

}
        const caregiverId= booking.caregiver_fk;

        const reviewSql= `
        INSERT INTO review (booking_fk, caregiver_fk, family_fk, rating_score, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING review_id
        `;
        await client.query(reviewSql,[bookingID, caregiverId, familyId, ratingScore, comments]);

        const avgRatingSql = `
            UPDATE caregiver c
            SET avg_rating = sub.new_avg
            FROM (
                SELECT ROUND(AVG(r.rating_score), 1) AS new_avg
                FROM review r
                WHERE r.caregiver_fk = $1
            ) AS sub
            WHERE c.caregiver_id = $1
            RETURNING c.avg_rating
        `;

        const updatedRatingResult = await client.query(avgRatingSql, [caregiverId]);

        await  client.query(`COMMIT`);

        return {
            caregiver_id: caregiverId,
            new_avg_rating: updatedRatingResult.rows[0].avg_rating
        };
        } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // Unique constraint violation (already reviewed)
            throw new Error('This booking has already been reviewed.');
        }
        throw error;
    } finally {
        client.release();
    }
};

module.exports={
    addReview
};