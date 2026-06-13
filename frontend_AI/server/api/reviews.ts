import { defineEventHandler, getQuery } from 'h3';
import { serverSupabaseClient } from '#supabase/server';

interface Review {
  review_id: string;
  user_id: string;
  target_id: string;
  target_type: string;
  rating: number;
  comment: string;
  timestamp: string;
  images: string[];
}

interface Doctor {
  doctor_id: string;
  name: string;
  department: string;
  hospital: string;
}

interface User {
  user_id: string;
  name: string;
  email: string;
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);
  const query = getQuery(event);

  const page = parseInt(query.page as string || '1', 10);
  const limit = parseInt(query.limit as string || '12', 10);
  const search = (query.search as string || '').toLowerCase();
  const doctorId = (query.doctorId as string || '');
  const department = (query.department as string || '');
  const minRating = parseInt(query.minRating as string || '0', 10);

  try {
    // Fetch all doctor reviews
    const { data: reviewsRaw, error: reviewsError } = await supabase
      .from('reviews')
      .select('review_id,user_id,target_id,target_type,rating,comment,timestamp,images')
      .eq('target_type', 'DOCTOR')
      .order('timestamp', { ascending: false });

    if (reviewsError) throw reviewsError;

    const reviews = (reviewsRaw || []) as Review[];

    // Collect unique IDs
    const doctorIds = [...new Set(reviews.map(r => r.target_id).filter(Boolean))] as string[];
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))] as string[];

    // Fetch doctors
    let doctors: Doctor[] = [];
    if (doctorIds.length > 0) {
      const { data, error } = await supabase
        .from('doctors')
        .select('doctor_id,name,department,hospital')
        .in('doctor_id', doctorIds);
      if (error) throw error;
      doctors = (data || []) as Doctor[];
    }

    // Fetch users
    let users: User[] = [];
    if (userIds.length > 0) {
      const { data, error } = await supabase
        .from('users')
        .select('user_id,name,email')
        .in('user_id', userIds);
      if (error) throw error;
      users = (data || []) as User[];
    }

    const docMap = new Map<string, Doctor>();
    doctors.forEach(d => docMap.set(d.doctor_id, d));

    const userMap = new Map<string, User>();
    users.forEach(u => userMap.set(u.user_id, u));

    // Join data
    let joined = reviews.map(rev => {
      const doc = docMap.get(rev.target_id);
      const user = userMap.get(rev.user_id);
      return {
        ...rev,
        doctor_name: doc?.name || 'Unknown Doctor',
        doctor_department: doc?.department || 'General',
        doctor_hospital: doc?.hospital || 'Unknown Hospital',
        reviewer_name: user?.name || 'Anonymous',
        reviewer_email: user?.email || '',
      };
    });

    // Apply filters
    if (search) {
      joined = joined.filter(r =>
        r.doctor_name.toLowerCase().includes(search) ||
        r.doctor_department.toLowerCase().includes(search) ||
        r.doctor_hospital.toLowerCase().includes(search) ||
        r.comment.toLowerCase().includes(search) ||
        r.reviewer_name.toLowerCase().includes(search)
      );
    }

    if (doctorId) {
      joined = joined.filter(r => r.target_id === doctorId);
    }

    if (department) {
      joined = joined.filter(r => r.doctor_department === department);
    }

    if (minRating > 0) {
      joined = joined.filter(r => r.rating >= minRating);
    }

    // Compute summary stats (before pagination)
    const avgRating = joined.length
      ? Math.round((joined.reduce((sum, r) => sum + r.rating, 0) / joined.length) * 10) / 10
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: joined.filter(r => r.rating === star).length
    }));

    // Paginate
    const total = joined.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const items = joined.slice(offset, offset + limit);

    // Build unique doctor list for filter dropdown
    const uniqueDoctors = Array.from(docMap.values()).map(d => ({
      doctor_id: d.doctor_id,
      name: d.name,
      department: d.department,
      hospital: d.hospital
    }));

    return {
      success: true,
      total,
      page,
      limit,
      totalPages,
      avgRating,
      ratingDistribution,
      items,
      doctors: uniqueDoctors
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
});
