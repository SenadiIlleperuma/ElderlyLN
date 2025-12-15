const db= require('../db');

const getProfileId=async(userId, role)=>{
    const table= role==='family' ? 'family' : 'caregiver';
    const idColumn= role==='family' ? 'family_id' : 'caregiver_id';

    const sql= `SELECT ${idColumn} FROM ${table} WHERE user_fk=$1`;
    const result= await db.query(sql,[userId]);
    
    if(result.rows.length===0){
         throw new Error (`${role.charAt(0).toUpperCase()+role.slice(1)} profile not found.`);
    }
    return result.rows[0][idColumn];
};

const fileComplaint=async(userId,bookingId,complaintReason, role)=>{
    if(role !=='family' && role !=='caregiver'){
        throw new Error ('Invalid user role for filing complaint.');
    }

    const profileId= await getProfileId (userId, role);
    const profileFK=role==='family' ? 'family_fk' : 'caregiver_fk';

    const client= await db.pool.connect();
    try{
        await client.query('BEGIN');

        const bookingCheckSql= `
            SELECT booking_id FROM booking 
            WHERE booking_id=$1 AND ${profileFK}=$2
        `;
        const bookingCheck= await client.query(bookingCheckSql,[bookingId, profileId]);

        if(bookingCheck.rows.length===0){
            throw new Error ('Booking not found for this user.');
        };
        const complaintSql= `
        INSERT INTO complaint (booking_fk, ${profileFK}, reason, filed_by_role, status)
            VALUES ($1, $2, $3, $4, 'Pending')
            RETURNING complaint_id
        `;
        const values = [bookingId, profileId, complaintReason, role];
        const result = await client.query(complaintSql, values);

        await client.query('UPDATE booking SET has_complaint = TRUE WHERE booking_id = $1', [bookingId]);

        await client.query('COMMIT');
        return result.rows[0];
} catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const resolveComplaint=async(complaintId,resolutionAction,newStatus,grantBadge=false)=>{
    const client= await db.pool.connect();
    try{
        await client.query('BEGIN');

        const updateComplaintSql= `
        UPDATE complaint 
        SET status = $1, resolution_note = $2, resolved_at = NOW()
            WHERE complaint_id = $3
            RETURNING booking_fk
        `;
        const result= await client.query(updateComplaintSql, [newStatus, resolutionAction, complaintId]);
        
        if(result.rows.length===0){
            throw new Error ('Complaint not found.');
        }

        if(grantBadge){
            const bookingFK= result.rows[0].booking_fk;
            const caregiverSql= `
            SELECT caregiver_fk FROM booking WHERE booking_id = $1
            `;
            const caregiverResult= await client.query(caregiverSql, [bookingFK]);
            const caregiverId= caregiverResult.rows[0].caregiver_fk;

            await client.query('UPDATE caregiver SET verification_badges = array_append(verification_badges, $1) WHERE caregiver_id = $2',
                ['Verified by Admin', caregiverId]);
            }
        await client.query('COMMIT');
        return{
            complaint_id: complaintId, status: newStatus,badgeGranted: grantBadge};
        } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        }
    };



module.exports={
    fileComplaint,
    resolveComplaint
};