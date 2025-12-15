const db = require ('../db');

const getProfileId = async (userId, role)=>{
    const table = role === 'family' ? 'family' : 'caregiver';
    const idColumn = role === 'family' ? 'family_id' : 'caregiver_id';

    const sql = `SELECT ${idColumn} FROM ${table} WHERE user_fk = $1`;
    const result = await db.query(sql,[userId]);

    if(result.rows.length===0){
        throw new Error (`Profile not found for user role: ${role}`);
    }
    return result.rows[0][idColumn];
};

const createBooking = async (userId, caregiverId, date, notes)=>{
    const familyId=await getProfileId(userId,'family');

    const sql=`INSERT INTO booking 
        (family_fk, caregiver_fk, service_date, booking_status)
        VALUES 
            ($1, $2, $3, $4)
        RETURNING booking_id, booking_status, family_fk`;

        const values =[familyId, caregiverId, date, 'Requested'];

        const result= await db.query (sql,values);
        return result.rows[0];

};

const updateBookingStatus= async (bookingId, newStatus, userId )=>{
    if(!['Accepted', 'Declined', 'Completed'].includes(newStatus)){
        throw new Error('Invalid booking status update.');

    }
    const sqlCheck= `SELECT c.user_fk, b.booking_status
        FROM booking b
        JOIN caregiver c ON b.caregiver_fk = c.caregiver_id
        WHERE b.booking_id = $1`;

    const checkResult = await db.query(sqlCheck, [bookingId]);
    const bookingDetails= checkResult.rows[0];

    if(!bookingDetails){
        throw new Error('Booking not found!');

    }

    if(bookingDetails.user_fk !== userId){
        throw new Error('Forbidden: Not authorized to update this booking.');

    }
    const updateSql = `UPDATE booking 
        SET booking_status = $1 
        WHERE booking_id = $2
        RETURNING booking_id, booking_status`;

    const result = await db.query(updateSql, [newStatus, bookingId]);
    return result.rows[0];

};

const getBookingsByUser= async(userId, userRole)=>{
    const isFamily = userRole === 'family';

    const profileId = await getProfileId(userId,isFamily ? 'family': 'caregiver');
    const fkColumn = isFamily ? 'family_fk' : 'caregiver_fk';
    
    const sql= `SELECT
       b.*,
       c.full_name as family_name,
       f.full_name as family_name,
       c.district as caregiver_district
    FROM booking b
    LEFT JOIN caregiver c ON b.caregiver_fk = c.caregiver_id
    LEFT JOIN family f ON b.family_fk = f.family_id
    WHERE b.${fkColumn} = $1 
    ORDER BY b.requested_at DESC`;

    const result= await db.query(sql, [profileId]);
    return result.rows;

};

module.exports={
    createBooking,
    updateBookingStatus,
    getBookingsByUser
};
