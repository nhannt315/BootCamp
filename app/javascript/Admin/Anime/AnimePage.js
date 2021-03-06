import React, { Component } from 'react';
import axios from '../axios_admin';
import { withRouter } from 'react-router-dom';
import { Button, message, Input, Pagination, List, Skeleton, Modal } from 'antd';

import AnimeItem from './AnimeItem';
import AnimeForm from './AnimeForm';

import './AnimePage.scss';

class AnimePage extends Component {

  state = {
    animeList: [],
    genreList: [],
    fileListCover: [],
    fileListBanner: [],
    page: 1,
    perPage: 5,
    total: 0,
    initLoading: false,
    currentAnime: null,
    listLoading: false,
    keyword: '',
    modalVisible: false,
    isEdit: false,
    animeDetail: null,
    coverChange: false,
    bannerChange: false
  };

  confirmDelete = (animeId) => {
    Modal.confirm({
      title: 'Do you want to delete this item?',
      content: 'This anime cannot be restored after deleting',
      onOk: () => {
        axios.delete(`/api/v1/animes/${animeId}`)
          .then(() => {
            message.success('Deleted successfully!');
            this.getAnimeList();
          })
          .catch(error => console.log(error));
      },
      onCancel() {
      },
    });
  };


  showModal = () => {
    this.setState({modalVisible: true, fileListCover: [], fileListBanner: [], isEdit: false});
    const form = this.formRef.props.form;
    form.resetFields();
  };

  handleCancel = () => {
    this.setState({modalVisible: false});
  };

  handleChangeCover = ({fileList}) => {
    this.setState({fileListCover: fileList, coverChange: true});
  };

  handleChangeBanner = ({fileList}) => {
    this.setState({fileListBanner: fileList, bannerChange: true});
  };

  editAnime = (anime) => {
    this.setState({});
    const form = this.formRef.props.form;
    form.resetFields();
    form.setFieldsValue({
      title: anime.name,
      jptitle: anime.title_native,
      description: anime.info,
      status: anime.status,
      genres: anime.genres.map(genre => genre.id),
      cover: {file: {
        uid: '-1',
        name: 'xxx.png',
        url: anime.cover_large
      }},
      banner: {file: {
        uid: '-1',
        name: 'xxx.png',
        url: anime.banner
      }}
    });
    this.setState({
      modalVisible: true,
      isEdit: true,
      animeDetail: anime,
      fileListCover: [{
        uid: '-1',
        name: 'xxx.png',
        url: anime.cover_large
      }],
      fileListBanner: [{
        uid: '-1',
        name: 'xxx.png',
        url: anime.banner
      }]
    });
  };

  handleCreate = () => {
    const form = this.formRef.props.form;
    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      this.createAnime(values);
      form.resetFields();
      this.setState({modalVisible: false});
    });
  };

  createAnime = (values) => {
    let bodyFormData = new FormData();
    bodyFormData.append('name', values.title);
    bodyFormData.append('title_native', values.jptitle);
    bodyFormData.append('info', values.description);
    bodyFormData.append('genres', values.genres.map(String));
    if(this.state.bannerChange){
      bodyFormData.append('banner', values.banner.file);
    }
    if(this.state.coverChange){
      bodyFormData.append('cover_large', values.cover.file);
      bodyFormData.append('cover_medium', values.cover.file);
    }
    bodyFormData.append('status', values.status);
    console.log(values);
    if(this.state.isEdit){
      this.sendRequestUpdateAnime(bodyFormData);
    }else{
      this.sendRequestCreateAnime(bodyFormData);
    }
  };

  sendRequestUpdateAnime = (bodyFormData) => {
    axios.put(`/api/v1/animes/${this.state.animeDetail.id}`, bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(() => {
        message.success('Anime updated successfully!');
        this.setState({isEdit: false, bannerChange: false, coverChange: false});
        this.getAnimeList();
      })
      .catch(error => console.log(error));
  };
  sendRequestCreateAnime = (bodyFormData) => {
    axios.post('/api/v1/animes', bodyFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(() => {
        message.success('Anime created successfully!');
        this.setState({isEdit: false, bannerChange: false, coverChange: false});
        this.getAnimeList();
      })
      .catch(error => console.log(error));
  };

  saveFormRef = (formRef) => {
    this.formRef = formRef;
  };

  getGenreList = () => {
    axios.get('http://localhost:3000/api/v1/genres?page=1&item_per_page=40')
      .then(response => {
        response.data.genres.map(obj => obj.key = obj.id);
        this.setState({genreList: response.data.genres});
      })
      .catch(error => {

      });
  };

  getAnimeList = (keyword = '') => {
    const {page, perPage} = this.state;
    this.setState({keyword: keyword, listLoading: true});
    axios.get(`/api/v1/animes?page=${page}&item_per_page=${perPage}&keyword=${keyword}`)
      .then(response => new Promise(resolve => setTimeout(() => resolve(response), 1000)))
      .then(response => {
        const {total, animes} = response.data;
        this.setState({listLoading: false, animeList: animes, total: total, initLoading: false});
      })
      .catch(error => {
        console.log(error);
        this.setState({listLoading: false, initLoading: false});
      });

  };

  componentDidMount() {
    this.getGenreList();
    this.setState({initLoading: true}, () => this.getAnimeList());
  }

  onShowSizeChange = (current, pageSize) => {
    console.log(current, pageSize);
    this.setState({page: 1, perPage: pageSize}, () => this.getAnimeList());
  };

  onPageChange = (current, pageSize) => {
    console.log(current, pageSize);
    this.setState({page: current, perPage: pageSize}, () => this.getAnimeList());
  };

  filterAnime = (e) => {
    this.setState({keyword: e.target.value});
    this.getAnimeList(e.target.value);
  };

  render() {
    return (
      <div>
        <div style={{margin: '0 8px 16px 0'}}>
          <Button onClick={this.showModal}>Add new anime</Button>
          <AnimeForm
            wrappedComponentRef={this.saveFormRef}
            visible={this.state.modalVisible}
            isEdit={this.state.isEdit}
            anime={this.state.animeDetail}
            onCancel={this.handleCancel}
            onCreate={this.handleCreate}
            genreList={this.state.genreList}
            fileListCover={this.state.fileListCover}
            fileListBanner={this.state.fileListBanner}
            handleChangeCover={this.handleChangeCover}
            handleChangeBanner={this.handleChangeBanner}
          />
          <Input.Search
            placeholder="Search for anime"
            onSearch={value => this.getAnimeList(value)}
            value={this.state.keyword}
            onChange={this.filterAnime}
            style={{width: 200, float: 'right'}}
          />
        </div>
        <List
          itemLayout="vertical"
          size="medium"
          loading={this.state.initLoading}
          dataSource={this.state.animeList}
          renderItem={anime => (
            <List.Item key={anime.id}>
              <Skeleton loading={this.state.listLoading} active>
                <AnimeItem anime={anime} confirmDelete={this.confirmDelete} editAnime={this.editAnime}/>
              </Skeleton>
            </List.Item>
          )}
        >
        </List>
        <Pagination
          style={{margin: '16px 0', float: 'right'}}
          showSizeChanger onShowSizeChange={this.onShowSizeChange}
          defaultCurrent={this.state.page}
          total={this.state.total}
          pageSize={this.state.perPage}
          pageSizeOptions={['5', '10', '15']}
          onChange={this.onPageChange}
          size="small"
        />
      </div>
    );
  }
}


export default withRouter(AnimePage);