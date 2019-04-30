const controller = {};

controller.listChart  = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }

  var date = new Date();
  var fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
  var toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  if(req.query && req.query.fromDate){
    fromDate = new Date(req.query.fromDate);
  } 
  if(req.query && req.query.toDate){
    toDate = new Date(req.query.toDate);
  }

  fromDate.setHours(0,0,0);
  toDate.setHours(0,0,0);

  let userId = req.session.user.id;
  if(req.session.user.role == 'SUPER_ADMIN'){
    userId = 0;
  }

  req.getConnection((err, conn) => {
    conn.query('SELECT * FROM account WHERE (user = ? OR 0 = ?) AND dolDate BETWEEN ? AND ? ORDER BY dolDate DESC', [ userId , userId ,fromDate, toDate],(err, account) => {
     if (err) {
      res.json(err);
     }
     res.render('chart', {
        data: account
     });
    });
  });
}

controller.list = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }

  var date = new Date();
  var fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
  var toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  if(req.query && req.query.fromDate){
    fromDate = new Date(req.query.fromDate);
  } 
  if(req.query && req.query.toDate){
    toDate = new Date(req.query.toDate);
  }

  fromDate.setHours(0,0,0);
  toDate.setHours(0,0,0);
  let userId = req.session.user.id;

  let projectDetails ;
  req.getConnection((err, conn) => {
    conn.query('SELECT code,displayCode FROM user_projects join projects on projects.id = user_projects.projectId where user_projects.userId = ? order by user_projects.sortBy',[userId],(err, projects) => {
      if (err) {
      res.json(err);
      }
        projectDetails  = projects
    });
  });

  if(req.session.user.role == 'SUPER_ADMIN'){
    userId = 0;
  }

  req.getConnection((err, conn) => {
    conn.query('SELECT * FROM account WHERE (user = ? OR 0 = ?) AND dolDate BETWEEN ? AND ? ORDER BY dolDate DESC', [ userId , userId ,fromDate, toDate],(err, account) => {
     if (err) {
      res.json(err);
     }
     res.render('accounts', {
        data: account,
        projectData : projectDetails
     });
    });
  });
};


controller.listReport = (req, res) => {
  if(!( req.session.user && req.session.user.id && req.session.user.role == 'SUPER_ADMIN')){
    res.redirect('/');
  }

  var date = new Date();
  var fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
  var toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  if(req.query && req.query.fromDate){
    fromDate = new Date(req.query.fromDate);
  } 
  if(req.query && req.query.toDate){
    toDate = new Date(req.query.toDate);
  }

  fromDate.setHours(0,0,0);
  toDate.setHours(0,0,0);

  let userReport ;
  req.getConnection((err, conn) => {
    conn.query('SELECT code, users.username,sum(timeMin) as totalMin, FLOOR(sum(timeMin)/60) as hours, (sum(timeMin)%60) as min FROM account inner join users on account.user = users.id WHERE dolDate BETWEEN ? AND ? group by code, users.username', 
    [fromDate, toDate],(err, reportData) => {if (err) {
      res.json(err);
      }
      userReport  = reportData
    });
  });

  req.getConnection((err, conn) => {
    conn.query('SELECT code, sum(timeMin) as totalMin, FLOOR(sum(timeMin)/60) as hours, (sum(timeMin)%60) as min FROM account WHERE dolDate BETWEEN ? AND ? group by code', 
    [fromDate, toDate],(err, reportData) => {
     if (err) {
      res.json(err);
     }

     res.render('report', {
        data: reportData,
        userReport : userReport
     });
    });
  });
};

controller.save = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }
  
  const data = req.body;
  var dol= new Date(data.dol);
  dol.setHours(0,0,0);

  data.dolDate = dol;
  var hoursArray = data.hours.split(':');
  data.timeMin = parseInt(hoursArray[0])*60 + parseInt(hoursArray[1]);
  data.user = req.session.user.id;
  
  req.getConnection((err, connection) => {
    const query = connection.query('INSERT INTO account set ?', data, (err, account) => {
      res.redirect('/l/dashboard');
    })
  })
};

controller.edit = (req, res) => {
  const { id } = req.params;
  req.getConnection((err, conn) => {
    conn.query("SELECT * FROM account WHERE id = ?", [id], (err, rows) => {
      res.render('accounts_edit', {
        data: rows[0]
      })
    });
  });
};

controller.update = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }

  const { id } = req.params;
  const data = req.body;
  var hoursArray = data.hours.split(':');
  data.timeMin = parseInt(hoursArray[0])*60 + parseInt(hoursArray[1]);  

  req.getConnection((err, conn) => {

  conn.query('UPDATE account set ? where id = ?', [data, id], (err, rows) => {
    res.redirect('/');
  });
  });
};

controller.delete = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }

  const { id } = req.params;
  req.getConnection((err, connection) => {
    connection.query('DELETE FROM account WHERE id = ?', [id], (err, rows) => {
      res.redirect('/');
    });
  });
}

module.exports = controller;
