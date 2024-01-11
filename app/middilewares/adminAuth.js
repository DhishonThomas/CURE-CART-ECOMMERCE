

const adminAuthMiddileware = (req,res,next)=>{
    if (req.session.isAdminAuth) {
      next();
    } else {
        res.render('admin/signIn')        
    }
}

module.exports = adminAuthMiddileware;
