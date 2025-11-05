from django.db import models
from django.contrib.auth.models import User
# Create your models here.


class Chats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.JSONField('Chats', default=dict)
    chat_id = models.IntegerField()
    time_stamp = models.DateField()
    title = models.CharField(max_length=50)