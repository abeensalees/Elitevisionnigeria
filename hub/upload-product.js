// ========================================
// UPLOAD.JS - Elite Vision Product Upload
// WITH CONFIRMATION MODAL
// ========================================

// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAa8YOgFrM8IJToII7YqvKwIDFF9iKmUWs",
  authDomain: "elitevisionlast.firebaseapp.com",
  projectId: "elitevisionlast",
  storageBucket: "elitevisionlast.firebasestorage.app",
  messagingSenderId: "275944328231",
  appId: "1:275944328231:web:06e23d8a48ff56460cd202",
  measurementId: "G-5JHR0LWST3"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "dbdmvshv9";
const CLOUDINARY_UPLOAD_PRESET = "products";

// Upload fee
const UPLOAD_FEE = 10000;

// Current user
let currentUser = null;

//UI Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const sidebarProfileNameEl = document.getElementById('sidebarProfileName');
const sidebarProfileRoleEl = document.getElementById('sidebarProfileRole');
const sidebarProfileImgEl = document.getElementById('sidebarProfileImg');
const darkModeToggle = document.getElementById('darkModeToggle');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const progressStatus = document.getElementById('progressStatus');
const progressPercent = document.getElementById('progressPercent');
const earningsTableBody = document.getElementById('earningsTableBody');
const emptyState = document.getElementById('emptyState');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreview = document.getElementById('filePreview');

// Uploaded files array
let uploadedFiles = [];

// ========================================
// 🆕 CONFIRMATION MODAL ELEMENTS
// ========================================
let confirmationModal = null;
let confirmCallback = null;

// ========================================
// 🆕 CREATE CONFIRMATION MODAL
// ========================================
function createConfirmationModal() {
    if (confirmationModal) return;
    
    confirmationModal = document.createElement('div');
    confirmationModal.id = 'uploadConfirmModal';
    confirmationModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    confirmationModal.innerHTML = `
        <div style="
            background: var(--card-bg, white);
            border-radius: 16px;
            padding: 30px;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            animation: modalSlideIn 0.3s ease-out;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, #F59E0B, #EF4444);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px;
                ">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: white;"></i>
                </div>
                <h2 style="
                    color: var(--text-primary, #1F2937);
                    font-size: 22px;
                    margin: 0 0 10px 0;
                    font-weight: 600;
                ">Confirm Upload Fee</h2>
                <p style="
                    color: var(--text-secondary, #6B7280);
                    font-size: 14px;
                    margin: 0;
                ">Please review the payment details</p>
            </div>
            
            <div style="
                background: var(--section-bg, #F9FAFB);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 25px;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                ">
                    <span style="color: var(--text-secondary, #6B7280); font-size: 14px;">Upload Fee:</span>
                    <strong style="color: var(--text-primary, #1F2937); font-size: 18px;">₦10,000.00</strong>
                </div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                ">
                    <span style="color: var(--text-secondary, #6B7280); font-size: 14px;">Payment From:</span>
                    <strong style="color: #10B981; font-size: 14px;">
                        <i class="fas fa-gift"></i> Bonus Wallet
                    </strong>
                </div>
                <div style="
                    border-top: 1px solid var(--border-color, #E5E7EB);
                    padding-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="color: var(--text-secondary, #6B7280); font-size: 14px;">Your Balance:</span>
                    <strong id="modalCurrentBalance" style="color: var(--text-primary, #1F2937); font-size: 16px;">₦0.00</strong>
                </div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 10px;
                ">
                    <span style="color: var(--text-secondary, #6B7280); font-size: 14px;">After Upload:</span>
                    <strong id="modalNewBalance" style="color: #059669; font-size: 16px;">₦0.00</strong>
                </div>
            </div>
            
            <div style="
                background: #FEF3C7;
                border-left: 4px solid #F59E0B;
                border-radius: 8px;
                padding: 12px 15px;
                margin-bottom: 25px;
            ">
                <p style="
                    color: #92400E;
                    font-size: 13px;
                    margin: 0;
                    line-height: 1.5;
                ">
                    <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
                    This fee will be automatically deducted from your <strong>Bonus Wallet</strong> upon confirmation.
                </p>
            </div>
            
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            ">
                <button id="modalCancelBtn" style="
                    background: var(--section-bg, #F3F4F6);
                    color: var(--text-primary, #374151);
                    border: 1px solid var(--border-color, #E5E7EB);
                    padding: 14px 20px;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                ">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button id="modalConfirmBtn" style="
                    background: linear-gradient(135deg, #10B981, #059669);
                    color: white;
                    border: none;
                    padding: 14px 20px;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                ">
                    <i class="fas fa-check"></i> Confirm & Pay
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmationModal);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Event listeners
    document.getElementById('modalCancelBtn').addEventListener('click', closeConfirmationModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback(true);
        }
        closeConfirmationModal();
    });
    
    // Hover effects
    const cancelBtn = document.getElementById('modalCancelBtn');
    cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = '#E5E7EB';
        cancelBtn.style.transform = 'translateY(-2px)';
    });
    cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = 'var(--section-bg, #F3F4F6)';
        cancelBtn.style.transform = 'translateY(0)';
    });
    
    const confirmBtn = document.getElementById('modalConfirmBtn');
    confirmBtn.addEventListener('mouseenter', () => {
        confirmBtn.style.transform = 'translateY(-2px)';
        confirmBtn.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
    });
    confirmBtn.addEventListener('mouseleave', () => {
        confirmBtn.style.transform = 'translateY(0)';
        confirmBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
    });
}

// ========================================
// 🆕 SHOW CONFIRMATION MODAL
// ========================================
function showConfirmationModal(currentBalance) {
    return new Promise((resolve) => {
        createConfirmationModal();
        
        const newBalance = currentBalance - UPLOAD_FEE;
        
        document.getElementById('modalCurrentBalance').textContent = 
            `₦${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        document.getElementById('modalNewBalance').textContent = 
            `₦${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        
        confirmationModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        confirmCallback = (confirmed) => {
            resolve(confirmed);
        };
    });
}

// ========================================
// 🆕 CLOSE CONFIRMATION MODAL
// ========================================
function closeConfirmationModal() {
    if (confirmationModal) {
        confirmationModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (confirmCallback) {
            confirmCallback(false);
        }
    }
}

// ========================================
// AUTH STATE LISTENER
// ========================================
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.uid);
        loadUserProducts();
    } else {
        console.log('❌ No user logged in');
        window.location.replace('/sign-in');
    }
});


// ========================================
// SIMPLE LOGOUT FUNCTION
// ========================================
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut()
            .then(() => {
                localStorage.clear();
                window.location.replace('/sign-in');
            })
            .catch((error) => {
                console.error('Logout error:', error);
                window.location.replace('/sign-in');
            });
    }
}

// Attach to button
document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

// ========================================
// CHECK BONUS WALLET BALANCE
// ========================================
async function checkBonusWallet() {
    try {
        console.log('🔍 Checking bonus wallet...');
        const userRef = db.collection('users').doc(currentUser.uid);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) {
            throw new Error('User data not found');
        }
        
        const userData = userSnap.data();
        const bonusWallet = userData.bonusWallet || 0;
        
        console.log('💰 Current bonus wallet:', bonusWallet);
        
        if (bonusWallet < UPLOAD_FEE) {
            return {
                success: false,
                message: `Insufficient balance! You need ₦${UPLOAD_FEE.toLocaleString()} in your bonus wallet. Current balance: ₦${bonusWallet.toLocaleString()}`
            };
        }
        
        return {
            success: true,
            currentBalance: bonusWallet,
            username: userData.username || 'Unknown'
        };
    } catch (error) {
        console.error('❌ Error checking bonus wallet:', error);
        return {
            success: false,
            message: 'Error checking wallet balance. Please try again.'
        };
    }
}

// ========================================
// DEDUCT FROM BONUS WALLET
// ========================================
async function deductFromBonusWallet() {
    try {
        console.log('💳 Deducting ₦' + UPLOAD_FEE.toLocaleString() + ' from bonus wallet...');
        const userRef = db.collection('users').doc(currentUser.uid);
        
        await userRef.update({
            bonusWallet: firebase.firestore.FieldValue.increment(-UPLOAD_FEE),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Deduction successful');
        return { success: true };
    } catch (error) {
        console.error('❌ Error deducting from bonus wallet:', error);
        return {
            success: false,
            message: 'Error processing payment. Please try again.'
        };
    }
}

// ========================================
// UPLOAD IMAGE TO CLOUDINARY
// ========================================
async function uploadImageToCloudinary(file) {
    try {
        console.log('☁️ Uploading image to Cloudinary:', file.name);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Upload failed');
        }
        
        const data = await response.json();
        console.log('✅ Image uploaded successfully:', data.secure_url);
        
        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id
        };
    } catch (error) {
        console.error('❌ Error uploading to Cloudinary:', error);
        return {
            success: false,
            message: error.message || 'Error uploading image'
        };
    }
}

// ========================================
// UPLOAD ALL IMAGES
// ========================================
async function uploadAllImages(files, onProgress) {
    const imageUrls = [];
    const totalFiles = Math.min(files.length, 3);
    
    console.log(`📤 Uploading ${totalFiles} images...`);
    
    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        if (onProgress) {
            const percentage = 30 + ((i / totalFiles) * 40);
            onProgress({
                current: i + 1,
                total: totalFiles,
                percentage: percentage,
                status: `Uploading image ${i + 1} of ${totalFiles}...`
            });
        }
        
        const result = await uploadImageToCloudinary(file);
        
        if (result.success) {
            imageUrls.push(result.url);
        } else {
            throw new Error(`Failed to upload image ${i + 1}: ${result.message}`);
        }
    }
    
    console.log('✅ All images uploaded successfully');
    return imageUrls;
}

// ========================================
// CREATE PRODUCT IN FIRESTORE
// ========================================
async function createProduct(productData, username) {
    try {
        console.log('📝 Creating product in Firestore...');
        
        const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const productRef = db.collection('products').doc(productId);
        
        const product = {
            id: productId,
            title: productData.title,
            category: productData.category,
            description: productData.description,
            price: parseFloat(productData.price),
            quantity: parseInt(productData.quantity),
            link: productData.link,
            status: 'pending',
            image1: productData.images[0] || '',
            image2: productData.images[1] || '',
            image3: productData.images[2] || '',
            userId: currentUser.uid,
            username: username,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await productRef.set(product);
        console.log('✅ Product created:', productId);
        
        await createHistoryEntry(productId, product);
        
        return {
            success: true,
            productId: productId
        };
    } catch (error) {
        console.error('❌ Error creating product:', error);
        return {
            success: false,
            message: 'Error creating product. Please try again.'
        };
    }
}

// ========================================
// CREATE HISTORY ENTRY
// ========================================
async function createHistoryEntry(productId, productData) {
    try {
        console.log('📋 Creating history entry...');
        
        const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const historyRef = db.collection('history').doc(historyId);
        
        await historyRef.set({
            id: historyId,
            productId: productId,
            userId: currentUser.uid,
            action: 'product_uploaded',
            productTitle: productData.title,
            productCategory: productData.category,
            productPrice: productData.price,
            fee: UPLOAD_FEE,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ History entry created');
        return { success: true };
    } catch (error) {
        console.error('⚠️ Error creating history:', error);
        return { success: false };
    }
}

// ========================================
// FORM SUBMISSION HANDLER - 🆕 WITH CONFIRMATION
// ========================================
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submitted');
    
    if (!currentUser) {
        alert('Please log in to upload products');
        window.location.href = 'sign-in.html';
        return;
    }
    
    if (uploadedFiles.length === 0) {
        alert('Please upload at least one product image (maximum 3 images)');
        return;
    }
    
    if (uploadedFiles.length > 3) {
        alert('Maximum 3 images allowed');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Step 1: Check bonus wallet
        progressStatus.textContent = 'Checking wallet balance...';
        uploadProgress.classList.add('active');
        progressBar.style.width = '10%';
        progressPercent.textContent = '10%';
        
        const walletCheck = await checkBonusWallet();
        
        if (!walletCheck.success) {
            alert(walletCheck.message);
            throw new Error('Insufficient balance');
        }
        
        // 🆕 Step 2: Show confirmation modal
        uploadProgress.classList.remove('active');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        
        const confirmed = await showConfirmationModal(walletCheck.currentBalance);
        
        if (!confirmed) {
            console.log('❌ User cancelled upload');
            throw new Error('Upload cancelled by user');
        }
        
        console.log('✅ User confirmed payment');
        
        // Step 3: Show progress again and deduct from bonus wallet
        uploadProgress.classList.add('active');
        progressStatus.textContent = 'Processing payment...';
        progressBar.style.width = '20%';
        progressPercent.textContent = '20%';
        
        const deductResult = await deductFromBonusWallet();
        
        if (!deductResult.success) {
            alert(deductResult.message);
            throw new Error('Payment failed');
        }
        
        // Step 4: Upload images to Cloudinary
        progressStatus.textContent = 'Uploading images...';
        progressBar.style.width = '30%';
        progressPercent.textContent = '30%';
        
        const imageUrls = await uploadAllImages(uploadedFiles, (progress) => {
            progressBar.style.width = `${progress.percentage}%`;
            progressPercent.textContent = `${Math.round(progress.percentage)}%`;
            progressStatus.textContent = progress.status;
        });
        
        // Step 5: Get form data
        const formData = {
            category: document.getElementById('category').value,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            price: document.getElementById('price').value,
            quantity: document.getElementById('quantity').value,
            link: document.getElementById('link').value,
            images: imageUrls
        };
        
        // Step 6: Create product
        progressStatus.textContent = 'Creating product...';
        progressBar.style.width = '80%';
        progressPercent.textContent = '80%';
        
        const createResult = await createProduct(formData, walletCheck.username);
        
        if (!createResult.success) {
            alert(createResult.message);
            throw new Error('Product creation failed');
        }
        
        // Step 7: Complete
        progressStatus.textContent = 'Upload complete!';
        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';
        
        setTimeout(() => {
            alert(`✅ Product uploaded successfully!\n\n₦${UPLOAD_FEE.toLocaleString()} has been deducted from your bonus wallet.`);
            uploadProgress.classList.remove('active');
            uploadForm.reset();
            filePreview.innerHTML = '';
            uploadedFiles = [];
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
            loadUserProducts();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        uploadProgress.classList.remove('active');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        
        if (error.message !== 'Insufficient balance' && 
            error.message !== 'Payment failed' && 
            error.message !== 'Upload cancelled by user') {
            alert(`Error: ${error.message || 'Upload failed. Please try again.'}`);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Product';
    }
});

// ========================================
// LOAD USER PRODUCTS
// ========================================
async function loadUserProducts() {
    try {
        if (!currentUser) {
            console.log('⚠️ No user logged in');
            return;
        }
        
        console.log('📊 Loading user products...');
        
        const productsRef = db.collection('products');
        const querySnapshot = await productsRef.where('userId', '==', currentUser.uid).get();
        
        if (querySnapshot.empty) {
            console.log('📭 No products found');
            earningsTableBody.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }
        
        console.log(`✅ Found ${querySnapshot.size} products`);
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        earningsTableBody.innerHTML = '';
        
        const products = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            products.push(data);
        });
        
        products.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        
        products.forEach((product, index) => {
            const row = createProductRow(index + 1, product);
            earningsTableBody.appendChild(row);
        });
        
        console.log('✅ Products loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        earningsTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #EF4444;">
                    ⚠️ Error loading products. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

// ========================================
// CREATE PRODUCT ROW
// ========================================
function createProductRow(index, product) {
    const row = document.createElement('tr');
    
    const statusBadge = product.status === 'pending' 
        ? '<span style="color: #F59E0B; font-weight: 500;">⏳ Pending</span>'
        : product.status === 'approved' 
        ? '<span style="color: #10B981; font-weight: 500;">✅ Approved</span>'
        : '<span style="color: #EF4444; font-weight: 500;">❌ Rejected</span>';
    
    const truncatedDesc = product.description.length > 50 
        ? product.description.substring(0, 50) + '...'
        : product.description;
    
    row.innerHTML = `
        <td>${index}</td>
        <td><span style="text-transform: capitalize;">${product.category}</span></td>
        <td><strong>${product.title}</strong></td>
        <td>${truncatedDesc}</td>
        <td><strong>₦${parseFloat(product.price).toLocaleString()}</strong></td>
        <td>${product.quantity}</td>
        <td><a href="${product.link}" target="_blank" style="color: var(--primary-green); text-decoration: none;">📱 Contact</a></td>
        <td>
            <button class="delete-btn" data-product-id="${product.id}" data-product-title="${product.title}" style="
                background: #EF4444;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            ">
                <i class="fas fa-trash"></i> Delete
            </button>
        </td>
    `;
    
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        deleteProduct(this.dataset.productId, this.dataset.productTitle);
    });
    
    deleteBtn.addEventListener('mouseenter', function() {
        this.style.background = '#DC2626';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
    });
    
    deleteBtn.addEventListener('mouseleave', function() {
        this.style.background = '#EF4444';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    return row;
}

// ========================================
// DELETE PRODUCT
// ========================================
async function deleteProduct(productId, productTitle) {
    const confirmDelete = confirm(`⚠️ Are you sure you want to delete this product?\n\n"${productTitle}"\n\nThis action cannot be undone!`);
    
    if (!confirmDelete) {
        return;
    }
    
    console.log('🗑️ Deleting product:', productId);
    
    try {
        await db.collection('products').doc(productId).delete();
        
        const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.collection('history').doc(historyId).set({
            id: historyId,
            productId: productId,
            userId: currentUser.uid,
            action: 'product_deleted',
            productTitle: productTitle,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Product deleted successfully');
        alert('✅ Product deleted successfully!');
        loadUserProducts();
        
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        alert('❌ Error deleting product. Please try again.');
    }
}

// ========================================
// FILE HANDLING
// ========================================
fileUploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('dragover');
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024;
        
        if (!isValidType) {
            alert('⚠️ Please upload only image files');
            return false;
        }
        
        if (!isValidSize) {
            alert('⚠️ File size must be less than 5MB');
            return false;
        }
        
        return true;
    });
    
    const remainingSlots = 3 - uploadedFiles.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    if (validFiles.length > filesToAdd.length) {
        alert(`⚠️ Maximum 3 images. Adding ${filesToAdd.length} images.`);
    }
    
    filesToAdd.forEach(file => {
        uploadedFiles.push(file);
        createPreview(file);
    });
    
    fileInput.value = '';
}

function createPreview(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        previewItem.innerHTML = `
            <img src="${e.target.result}" alt="Preview" class="preview-image">
            <button type="button" class="preview-remove">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        filePreview.appendChild(previewItem);
        
        const removeBtn = previewItem.querySelector('.preview-remove');
        removeBtn.addEventListener('click', () => {
            const index = uploadedFiles.indexOf(file);
            if (index > -1) {
                uploadedFiles.splice(index, 1);
            }
            previewItem.remove();
        });
    };
    
    reader.readAsDataURL(file);
}

// ========================================
// CLOSE PROGRESS
// ========================================
const progressClose = document.getElementById('progressClose');
if (progressClose) {
    progressClose.addEventListener('click', () => {
        uploadProgress.classList.remove('active');
    });
}

//UI SIDEBAR, TOGGLES.....
// Sidebar Toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    mobileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
});

mobileOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Dropdown Menus
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.closest('.menu-dropdown');
        dropdown.classList.toggle('active');
    });
});

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    icon.classList.toggle('fa-moon', !isDarkMode);
    icon.classList.toggle('fa-sun', isDarkMode);
    
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
});

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    if (icon) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

// ========================================
// INITIALIZE
// ========================================
console.log('✅ Elite Vision Upload System Initialized');
console.log('💰 Upload Fee: ₦' + UPLOAD_FEE.toLocaleString());
console.log('☁️ Cloudinary Integration Active');
console.log('🆕 Confirmation Modal Active');