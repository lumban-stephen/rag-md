        {/* OpenSearch Index Refresh */}
        <Card>
          <CardHeader>
            <CardTitle>OpenSearch Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manually refresh the OpenSearch index to ensure all document changes are searchable.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={handleRefreshIndex}
                  isLoading={isRefreshing}
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Refresh Index
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">S3 Bucket:</span>
                <Badge variant={s3Status === 'online' ? 'success' : 'danger'}>
                  {s3Status === 'online' ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">OpenSearch Cluster:</span>
                <Badge variant={opensearchStatus === 'online' ? 'success' : 'danger'}>
                  {opensearchStatus === 'online' ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lambda Functions:</span>
                <Badge variant={lambdaStatus === 'online' ? 'success' : 'danger'}>
                  {lambdaStatus === 'online' ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card> 