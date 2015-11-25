import React from 'react';
import {Row, Col, Icon, Progress, Table, Menu, Switch, message, Modal, Button, Form, Input, Checkbox, Radio} from 'antd';
import { Router, Route, Link } from 'react-router'

const ButtonGroup = Button.Group;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;

function asyncGetData(type) {
  let url = '/home/stu/ajax?type=' + type;
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      type: 'GET',
      success: res => resolve(res),
      fail: err => reject(err)
    });
  });
}

function modifyPersonData(data) {
  let url = "/home/stu/modify";
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: url,
      data: data,
      success: res => resolve(res),
      fail: err => reject(err)
    });
  });
}

function asyncAddScore(id, activity, score) {
  let url = "/home/activity/add";
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      type: 'POST',
      data: {
        xueyuan_id: id,
        activity: activity,
        score: score
      },
      success: res => resolve(res),
      fail: err => reject(err)
    });
  });
}

function asyncFirePerson(id, restore) {
  let url = `/home/stu/${restore ? "restore" : "fire"}`;
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      type: 'POST',
      data: {fireId: id},
      success: res => resolve(res),
      fail: err => reject(err)
    });
  });
}

class App extends React.Component {
  constructor(...args) {
    super(...args);
    let self = this;
    let columns = [
      {
        title: 'ID',
        dataIndex: 'key'
      }, {
        title: '方向',
        dataIndex: 'type'
      }, {
        title: '姓名',
        dataIndex: 'name'
      }, {
        title: '电话',
        dataIndex: 'tel'
      }, {
        title: '学号',
        dataIndex: 'xh'
      }, {
        title: 'QQ',
        dataIndex: 'qq'
      }, {
        title: '分数',
        dataIndex: 'score'
      }, {
        title: '操作',
        dataIndex: '',
        render: function(text, record) {
          return (<ButtonGroup>
                  <Button onClick={e => {self.modifyData(record)}}>改信息</Button>
                  <Button onClick={e => {self.firePerson(record)}}>{self.state.current == 'fired' ? "恢复" : "踢了"}</Button>
              </ButtonGroup>);
        }
      }, {
        title: '分数操作',
        dataIndex: '',
        render: function(text, record) {
          return (<ButtonGroup>
            <Button onClick={e => {self.addScore(record, -20)}}>-20</Button>
            <Button onClick={e => {self.addScore(record, -10)}}>-10</Button>
            <Button onClick={e => {self.addScore(record, 10)}}>+10</Button>
            <Button onClick={e => {self.addScore(record, 20)}}>+20</Button>
            <Button onClick={e => {self.addScore(record, 30)}}>+30</Button>
          </ButtonGroup>);
        }
      }];
    this.state = {
      columns: columns,
      data: [],
      current: 'fe',
      tableLoading: true,

      modalConfirmLoading: false,
      modalVisible: false,
      modalFormData: {
        id: 0,
        type: '',
        realname: '',
        tel: '',
        xh: '',
        qq: '',
        score: 0
      }
    };
  }

  showModal(item) {
    this.setState({
      modalVisible: true,
      modalFormData: item
    });
  }

  handleModalFormChange(e, field) {
    let formData = this.state.modalFormData;
    formData[field] = e.target.value;
    this.setState({modalFormData: formData});
  }

  handleModalConfirm(e) {
    this.setState({modalConfirmLoading: true});
    modifyPersonData(this.state.modalFormData).then(res => {
      this.setState({
        modalConfirmLoading: false,
        modalVisible: false
      });
      message.success('修改成功');
    }).catch(err => {
      this.setState({
        modalConfirmLoading: false,
        modalVisible: false
      });
      message.success('修改失败');
    });
  }
  handleModalCancle() {
    this.setState({modalVisible: false});
  }

  componentWillMount() {
    asyncGetData(this.state.current).then(res => {
      this.setState({
        data: res.data.map(item => {
          item.key = item.id;
          item.name = item.realname;
          item.score = item.score || 0;
          item.xh = item.xh || '';
          return item;
        }),
        tableLoading: false
      });
    }).catch(err => {
      this.setState({
        tableLoading: false
      });
      this.showError(err);
    })
  }

  showError(str) {
    message.error(str);
  }

  modifyData(record) {
    let rawData = this.state.data;
    let data = rawData.map(d => {
      if (record.id == d.id) {
        this.showModal(d);
      }
      return d;
    });
    this.setState({
      data: data
    });
  }

  firePerson(record) {
    let restore = this.state.current === 'fired';
    this.setState({tableLoading: true});
    asyncFirePerson(record.id, restore).then(res => {
      message.success(`${record.realname}已经${restore ? "恢复" : "被踢"}了!`);
      this.setState({
        tableLoading: false,
        data: this.state.data.filter(_d => _d.id != record.id)
      });
    }).catch(err => {

    });
  }

  addScore(record, score) {
    this.setState({
      tableLoading: true
    });
    asyncAddScore(record.id, "后台管理", score).then(res => {
      this.setState({
        tableLoading: false,
        data: this.state.data.map(_d => {
          if(record.id == _d.id) {
            _d.score += score;
          }
          return _d;
        })
      });
      message.success(`给${record.realname}${score >= 0 ? "加" : "扣"}了${Math.abs(score)}分!`);
    }).catch(err => {
      this.setState({
        tableLoading: false
      });
      message.error(JSON.stringify(err));
    });
  }

  handleMenuClick(e) {
    let prevKey = this.state.current;
    this.setState({
      tableLoading: true
    });
    asyncGetData(e.key).then(res => {
      this.setState({
        data: res.data.map(item => {
          item.key = item.id;
          item.name = item.realname;
          item.score = item.score || 0;
          return item;
        }),
        current: e.key,
        tableLoading: false
      });
    }).catch(() => {
      this.showError("加载失败!%>_<%");
      this.setState({
        current: prevKey,
        tableLoading: false
      })
    })
  }

  log(e) {
    console.log(e);
  }

  render() {
    const modalFormData = this.state.modalFormData;
    return (<div className="container" style={{width: '960px', margin: '0 auto'}}>
      <Row>
        <Menu onClick={e => {this.handleMenuClick(e)}}
              selectedKeys={[this.state.current]}
              theme={this.state.theme}
              mode="horizontal">

          <Menu.Item key="fe">
            <Icon type="chrome" />前端名单
          </Menu.Item>

          <Menu.Item key="be">
            <Icon type="credit-card" />后端名单
          </Menu.Item>

          <Menu.Item key="fired">
            <Icon type="frown" />踢了的
          </Menu.Item>

        </Menu>
      </Row>

      <Row>
        <Table pagination={false} columns={this.state.columns}
               dataSource={this.state.data} loading={this.state.tableLoading} bordered={true}
               style={{marginTop: "5px"}}
        />
      </Row>

      <Row>

      </Row>

      <Modal ref="modal" visible={this.state.modalVisible}
             title="修改个人信息" onOk={e => {this.handleModalConfirm(e)}} onCancel={e => {this.handleModalCancle(e)}}
             footer={[<Button key="back" type="ghost" size="large" onClick={e => {this.handleModalCancle(e)}}>返 回</Button>,
                      <Button key="submit" type="primary" size="large" loading={this.state.modalConfirmLoading} onClick={e => {this.handleModalConfirm(e)}}>提 交</Button>]}

      >
        <Form horizontal>
          <FormItem
              label="方向："
              labelCol={{span: 6}}
              wrapperCol={{span: 14}}
              required={true} >
            <RadioGroup disabled={true} value="前端" name="type" value={modalFormData.type} onChange={e => {this.handleModalFormChange(e, 'type')}}>
              <Radio value="前端">前端</Radio>
              <Radio value="后端">后端</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem
              label="姓名："
              labelCol={{span: 6}}
              wrapperCol={{span: 6}}
              required={true} >
            <Input type="text" name="realname" value={modalFormData.realname} onChange={e => {this.handleModalFormChange(e, 'realname')}}/>
          </FormItem>
          <FormItem
              label="电话："
              labelCol={{span: 6}}
              wrapperCol={{span: 6}}
              required={false} >
            <Input type="tel" name="tel" value={modalFormData.tel} onChange={e => {this.handleModalFormChange(e, 'tel')}}/>
          </FormItem>
          <FormItem
              label="学号："
              labelCol={{span: 6}}
              wrapperCol={{span: 6}}
              required={false} >
            <Input type="number" name="xh" value={modalFormData.xh} onChange={e => {this.handleModalFormChange(e, 'xh')}}/>
          </FormItem>
          <FormItem
              label="QQ："
              labelCol={{span: 6}}
              wrapperCol={{span: 6}}
              required={false} >
            <Input type="text" name="qq" value={modalFormData.qq} onChange={e => {this.handleModalFormChange(e, 'qq')}}/>
          </FormItem>
          <FormItem
              label="分数："
              labelCol={{span: 6}}
              wrapperCol={{span: 6}}
              required={false} >
            <Input type="number" name="score" disabled={true} value={modalFormData.score} onChange={e => {this.handleModalFormChange(e, 'score')}}/>
          </FormItem>
        </Form>
      </Modal>
    </div>);
  }
}

export default App;