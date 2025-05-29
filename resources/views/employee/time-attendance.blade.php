@extends('layouts.app')

@section('content')
<div class="container">
    <h2>Time Attendance - Employee</h2>
    <div class="card">
        <div class="card-header">
            <form action="{{ route('attendance.store') }}" method="POST" class="d-flex align-items-center">
                @csrf
                <input type="hidden" name="employee_id" value="{{ auth()->user()->id }}">
                <button type="submit" name="action" value="check_in" class="btn btn-success me-2">Check In</button>
                <button type="submit" name="action" value="check_out" class="btn btn-danger">Check Out</button>
            </form>
        </div>
        <div class="card-body">
            <h5>Your Attendance Records</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($attendances as $attendance)
                    <tr>
                        <td>{{ $attendance->date }}</td>
                        <td>{{ $attendance->check_in ?? '-' }}</td>
                        <td>{{ $attendance->check_out ?? '-' }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection