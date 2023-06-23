import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Api from '../Api';
import { useStaticContext } from '../StaticContext';
import VersionsTable from './VersionsTable';

function TourPublish() {
  const staticContext = useStaticContext();
  const { TourId } = useParams();
  const [versions, setVersions] = useState();
  const [isPublishing, setPublishing] = useState();

  useEffect(() => {
    let isCancelled = false;
    if (TourId) {
      Api.versions.index(TourId).then((response) => {
        if (isCancelled) return;
        setVersions(response.data);
      });
    }
    return () => (isCancelled = true);
  }, [TourId]);

  async function publish(isStaging) {
    setPublishing(isStaging);
    const response = await Api.versions.create({
      TourId,
      isStaging,
    });
    versions.forEach((v) => {
      if (v.isStaging === isStaging) {
        v.isLive = false;
      }
    });
    setVersions([response.data, ...versions]);
    setPublishing();
  }

  async function onPublish(version) {
    await Api.versions.update(version.id, {
      isLive: true,
    });
    versions.forEach((v) => {
      if (v.isStaging === version.isStaging) {
        v.isLive = false;
      }
    });
    version.isLive = true;
    setVersions([...versions]);
  }

  async function onUnpublish(version) {
    await Api.versions.update(version.id, {
      isLive: false,
    });
    version.isLive = false;
    setVersions([...versions]);
  }

  async function onPromote(version) {
    await Api.versions.update(version.id, {
      isStaging: false,
    });
    version.isStaging = false;
    setVersions([...versions]);
  }

  return (
    <>
      <Helmet>
        <title>Publish Tour - {staticContext?.env?.SITE_TITLE}</title>
      </Helmet>
      <main className="container">
        <div className="row">
          <div className="col-md-6">
            <h1 className="mb-5">Publish Tour</h1>
            <h2>Production</h2>
            <VersionsTable onPublish={onPublish} onUnpublish={onUnpublish} versions={versions?.filter((v) => !v.isStaging)} />
            <div className="d-flex mb-5">
              <button disabled={isPublishing !== undefined} onClick={() => publish(false)} type="button" className="btn btn-primary me-2">
                Publish to Production
              </button>
              {isPublishing === false && <div className="spinner-border"></div>}
            </div>
            <h2>Staging</h2>
            <VersionsTable
              onPromote={onPromote}
              onPublish={onPublish}
              onUnpublish={onUnpublish}
              versions={versions?.filter((v) => v.isStaging)}
            />
            <div className="d-flex mb-5">
              <button disabled={isPublishing !== undefined} onClick={() => publish(true)} type="button" className="btn btn-primary me-2">
                Publish to Staging
              </button>
              {isPublishing === true && <div className="spinner-border"></div>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
export default TourPublish;
