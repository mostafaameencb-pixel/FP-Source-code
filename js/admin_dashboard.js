import { checkAdmin, loadAdminSidebar } from './admin_common.js';
import { db, collection, getDocs, query, where } from './firebase-config.js';

// Initialize
checkAdmin();
loadAdminSidebar('index');


$(document).ready(async function () {

    // 1. Fetch Users Count
    try {
        const usersSnap = await getDocs(collection(db, "users"));
        const totalUsers = usersSnap.size;
      
        $('#statUsers').text(totalUsers);

        let blockedCount = 0;
        usersSnap.forEach(doc => {
            if (doc.data().status === 0) blockedCount++;
        });


        $('#statBlocked').text(blockedCount);

    } catch (err) {
        console.error("Error fetching users:", err);
        $('#statUsers').text('Error');
    }

    

    // 2. Fetch Posts Count
    try {
        const postsSnap = await getDocs(collection(db, "Posts"));
        $('#statPosts').text(postsSnap.size);
    } 
    catch (err) {
        console.error("Error fetching posts:", err);
        $('#statPosts').text('Error');
    }


});
